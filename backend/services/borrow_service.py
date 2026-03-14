from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import models

def borrow_book(db: Session, reader_id: str, book_copy_id: str, librarian_id: int = 1):
    # 1. Kiểm tra Độc giả có đang mượn sách chưa trả không (Luật: 1 lần mượn 1 cuốn)
    active_borrow = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.reader_id == reader_id,
        models.BorrowRecord.status == "Borrowing"
    ).first()
    if active_borrow:
         raise HTTPException(status_code=400, detail="Độc giả này đang mượn 1 cuốn chưa trả. Vui lòng trả sách trước khi mượn mới!")
    
    # 2. Kiểm tra Bản sao sách có trong kho (Available) không
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == book_copy_id).first()
    if not db_copy:
         raise HTTPException(status_code=404, detail="Không tìm thấy mã bản sao sách này!")
    if db_copy.status != "Available":
         raise HTTPException(status_code=400, detail="Cuốn sách này đã có người mượn hoặc không sẵn sàng!")
         
    # 3. Tạo phiếu mượn & Cập nhật trạng thái sách
    db_copy.status = "Borrowed"
    new_record = models.BorrowRecord(
        reader_id=reader_id,
        book_copy_id=book_copy_id,
        librarian_id=librarian_id,
        status="Borrowing"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {"message": "Tạo phiếu mượn thành công!", "borrow_id": new_record.id}

def return_book(db: Session, borrow_id: int):
    # Tìm phiếu mượn
    record = db.query(models.BorrowRecord).filter(models.BorrowRecord.id == borrow_id).first()
    if not record or record.status == "Returned":
        raise HTTPException(status_code=400, detail="Phiếu mượn không tồn tại hoặc đã trả sách!")
        
    # Cập nhật phiếu mượn
    record.status = "Returned"
    record.return_date = datetime.utcnow()
    
    # Cập nhật lại kho sách
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == record.book_copy_id).first()
    if db_copy:
        db_copy.status = "Available"
        
    db.commit()
    return {"message": "Xác nhận trả sách thành công, đã xếp lại vào kho!"}

def get_borrows(db: Session, reader_id: str = None, status: str = None):
    query = db.query(models.BorrowRecord)
    if reader_id:
        query = query.filter(models.BorrowRecord.reader_id == reader_id)
    if status:
        query = query.filter(models.BorrowRecord.status == status)
    return query.all()
