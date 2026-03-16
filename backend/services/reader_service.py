from sqlalchemy.orm import Session
from fastapi import HTTPException
import models
import schemas

def create_reader(db: Session, reader: schemas.ReaderCreate):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader.id)
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
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader_id)
    if not db_reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy Độc giả!")
    
    update_data = reader_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_reader, key, value)
    db.commit()
    db.refresh(db_reader)
    return db_reader

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
    
    # Xoá mềm (Tối ưu hơn để giữ lịch sử)
    db_reader.is_active = False
    db.commit()
    db.refresh(db_reader)
    return {"detail": "Đã thu hồi (vô hiệu hóa) thẻ Độc giả này thành công!"}
