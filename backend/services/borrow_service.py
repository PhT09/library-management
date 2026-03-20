from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import models

def borrow_book(db: Session, reader_id: str, book_copy_id: str, librarian_id: int):
    """
    Tạo phiếu mượn sách.
    Luật: Mỗi Độc giả chỉ được mượn 1 cuốn tại một thời điểm.
    """
    # 1. Kiểm tra Độc giả tồn tại và đang active
    reader = db.query(models.Reader).filter(models.Reader.id == reader_id).first()
    if not reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy Độc giả với mã này!")
    if not reader.is_active:
        raise HTTPException(status_code=400, detail="Thẻ Độc giả này đã bị thu hồi (vô hiệu hóa)!")

    # 2. Kiểm tra Độc giả có đang mượn sách chưa trả không (Luật: 1 lần mượn 1 cuốn)
    active_borrow = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.reader_id == reader_id,
        models.BorrowRecord.status == "Borrowing"
    ).first()
    if active_borrow:
         raise HTTPException(status_code=400, detail="Độc giả này đang mượn 1 cuốn chưa trả. Vui lòng trả sách trước khi mượn mới!")
    
    # 3. Kiểm tra Bản sao sách có trong kho (Available) không
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == book_copy_id).first()
    if not db_copy:
         raise HTTPException(status_code=404, detail="Không tìm thấy mã bản sao sách này!")
    if db_copy.status != "Available":
         raise HTTPException(status_code=400, detail="Cuốn sách này đã có người mượn hoặc không sẵn sàng!")
         
    # 4. Tạo phiếu mượn & Cập nhật trạng thái sách
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
    """Xác nhận trả sách, cập nhật trạng thái phiếu và bản sao sách"""
    # Tìm phiếu mượn
    record = db.query(models.BorrowRecord).filter(models.BorrowRecord.id == borrow_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Phiếu mượn không tồn tại!")
    if record.status == "Returned":
        raise HTTPException(status_code=400, detail="Phiếu mượn này đã được trả sách trước đó!")
        
    # Cập nhật phiếu mượn
    record.status = "Returned"
    record.return_date = datetime.utcnow()
    
    # Cập nhật lại kho sách
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == record.book_copy_id).first()
    if db_copy:
        db_copy.status = "Available"
        
    db.commit()
    return {"message": "Xác nhận trả sách thành công, đã xếp lại vào kho!"}

def get_borrows(db: Session, reader_id: str = None, book_copy_id: str = None, status: str = None):
    """
    Lấy danh sách phiếu mượn, hỗ trợ lọc theo:
    - reader_id: Mã Độc giả
    - book_copy_id: Mã Bản sao sách
    - status: Borrowing hoặc Returned
    """
    query = db.query(
        models.BorrowRecord,
        models.Reader.full_name.label("reader_name"),
        models.Reader.class_name.label("reader_class"),
        models.BookCopy.book_id,
        models.Book.name.label("book_name")
    ).join(
        models.Reader, models.BorrowRecord.reader_id == models.Reader.id
    ).join(
        models.BookCopy, models.BorrowRecord.book_copy_id == models.BookCopy.id
    ).join(
        models.Book, models.BookCopy.book_id == models.Book.id
    )
    
    if reader_id:
        query = query.filter(models.BorrowRecord.reader_id == reader_id)
    if book_copy_id:
        query = query.filter(models.BorrowRecord.book_copy_id == book_copy_id)
    if status:
        query = query.filter(models.BorrowRecord.status == status)
    
    results = query.all()
    
    records = []
    for record, reader_name, reader_class, book_id, book_name in results:
        records.append({
            "id": record.id,
            "reader_id": record.reader_id,
            "reader_name": reader_name,
            "reader_class": reader_class,
            "book_copy_id": record.book_copy_id,
            "book_id": book_id,
            "book_name": book_name,
            "librarian_id": record.librarian_id,
            "borrow_date": record.borrow_date,
            "return_date": record.return_date,
            "status": record.status
        })
    
    return records
