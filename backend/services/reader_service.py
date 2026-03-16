from sqlalchemy.orm import Session
from fastapi import HTTPException
import models
import schemas

def create_reader(db: Session, reader: schemas.ReaderCreate):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader.id).first()
    if db_reader:
        raise HTTPException(status_code=400, detail="Mã Độc giả đã tồn tại!")
    new_reader = models.Reader(**reader.dict())
    db.add(new_reader)
    db.commit()
    db.refresh(new_reader)
    return new_reader

def get_all_readers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Reader).offset(skip).limit(limit).all()

def get_reader_by_id(db: Session, reader_id: str):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader_id).first()
    if not db_reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy Độc giả!")
    return db_reader

def update_reader(db: Session, reader_id: str, reader_update: schemas.ReaderUpdate):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader_id).first()
    if not db_reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy Độc giả!")
    
    update_data = reader_update.dict(exclude_unset=True)
    if "is_active" in update_data:
        raise HTTPException(status_code=400, detail="Không được phép sửa trạng thái hoạt động (is_active) của thẻ thông qua API này.")
        
    for key, value in update_data.items():
        setattr(db_reader, key, value)
    db.commit()
    db.refresh(db_reader)
    return db_reader

def toggle_reader_status(db: Session, reader_id: str):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader_id).first()
    if not db_reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy Độc giả!")
        
    db_reader.is_active = not db_reader.is_active
    db.commit()
    db.refresh(db_reader)
    
    status_str = "kích hoạt" if db_reader.is_active else "khóa"
    return {"detail": f"Đã {status_str} thẻ Độc giả thành công!", "is_active": db_reader.is_active}

def delete_reader(db: Session, reader_id: str):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader_id).first()
    if not db_reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy Độc giả!")
    
    # Kiểm tra xem sinh viên có đang mượn sách không
    active_borrows = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.reader_id == reader_id,
        models.BorrowRecord.status == "Borrowing"
    ).first()
    if active_borrows:
        raise HTTPException(status_code=400, detail="Không thể xóa! Độc giả này còn sách chưa trả.")
    
    # Xoá cứng khỏi dữ liệu
    db.delete(db_reader)
    db.commit()
    return {"detail": "Đã xóa Độc giả khỏi hệ thống thành công!"}
