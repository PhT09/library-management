from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.user import User
from models.borrow import BorrowRecord
from schemas.user import UserCreate, UserUpdate
from core.security import get_password_hash

def get_librarians(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).filter(User.role == "librarian").offset(skip).limit(limit).all()

def create_librarian(db: Session, user_in: UserCreate):
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role="librarian", # Ép kiểu bảo mật: chỉ cho phép module này sinh role librarian, chặn tạo Admin thứ 2
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_librarian(db: Session, librarian_id: int, user_in: UserUpdate):
    db_user = db.query(User).filter(User.id == librarian_id, User.role == "librarian").first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Librarian not found")
        
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
        
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_librarian_and_reassign(db: Session, librarian_id: int, target_librarian_id: int):
    # Bảo vệ tài khoản admin, nghiêm cấm xoá
    protect_user = db.query(User).filter(User.id == librarian_id).first()
    if protect_user and protect_user.role == "admin":
        raise HTTPException(status_code=403, detail="Hành động cấm! Không thể xóa tài khoản Administrator.")

    db_user = db.query(User).filter(User.id == librarian_id, User.role == "librarian").first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Librarian not found")
        
    target_user = db.query(User).filter(User.id == target_librarian_id, User.role == "librarian", User.is_active == True).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target active librarian for reassignment not found")
        
    if librarian_id == target_librarian_id:
        raise HTTPException(status_code=400, detail="Cannot reassign data to the same librarian")

    active_librarians = db.query(User).filter(User.role == "librarian", User.is_active == True).count()
    # RÀNG BUỘC (CRITICAL CONSTRAINT): Bảo đảm luôn có tài khoản Backup Librarian
    # Nếu chỉ còn <=1 tài khoản active, tuyệt đối vô hiệu hóa lệnh xóa để hệ thống không bị ngừng vận hành
    if active_librarians <= 1 and getattr(db_user, 'is_active', True):
        raise HTTPException(status_code=400, detail="Cannot delete. The system must always maintain at least one active 'Backup Librarian' account.")
    
    # RÀNG BUỘC (CRITICAL SETTINGS): DATA REASSIGNMENT
    # Gán lại tất cả các lịch sử/giao dịch mượn trả từ tài khoản cũ sang cho người tiếp quản
    records = db.query(BorrowRecord).filter(BorrowRecord.librarian_id == librarian_id).all()
    for record in records:
        record.librarian_id = target_librarian_id
    
    # Delete or deactivate account
    db.delete(db_user)
    db.commit()
    return {"message": "Librarian deleted successfully and data reassigned"}
