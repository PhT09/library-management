from sqlalchemy.orm import Session
from sqlalchemy import func
import models

def get_top_borrowed_books(db: Session, limit: int = 10):
    # Đếm số lượng mượn (đối với mỗi đầu sách)
    # Join BorrowRecord -> BookCopy -> Book
    query = (
        db.query(models.Book, func.count(models.BorrowRecord.id).label("borrow_count"))
        .join(models.BookCopy, models.Book.id == models.BookCopy.book_id)
        .join(models.BorrowRecord, models.BookCopy.id == models.BorrowRecord.book_copy_id)
        .group_by(models.Book.id)
        .order_by(func.count(models.BorrowRecord.id).desc())
        .limit(limit)
    )
    
    results = query.all()
    
    # Format lại kết quả trả ra
    report = []
    for book, count in results:
        repo_item = {
            "book_id": book.id,
            "book_name": book.name,
            "author": book.author,
            "category_id": book.category_id,
            "borrow_count": count
        }
        report.append(repo_item)
        
    return report

def get_unreturned_readers(db: Session):
    # Danh sách những sinh viên có phiếu mượn mang status="Borrowing"
    query = (
        db.query(models.BorrowRecord, models.Reader, models.BookCopy, models.Book)
        .join(models.Reader, models.BorrowRecord.reader_id == models.Reader.id)
        .join(models.BookCopy, models.BorrowRecord.book_copy_id == models.BookCopy.id)
        .join(models.Book, models.BookCopy.book_id == models.Book.id)
        .filter(models.BorrowRecord.status == "Borrowing")
    )
    
    results = query.all()
    
    report = []
    for record, reader, copy, book in results:
        report.append({
            "borrow_id": record.id,
            "reader_id": reader.id,
            "reader_name": reader.full_name,
            "class_name": reader.class_name,
            "book_copy_id": copy.id,
            "book_name": book.name,
            "borrow_date": record.borrow_date
        })
        
    return report
