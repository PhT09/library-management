from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from db.session import Base

class BorrowRecord(Base):
    __tablename__ = "borrow_records"
    id = Column(Integer, primary_key=True, index=True)
    reader_id = Column(String(20), ForeignKey("readers.id"))
    book_copy_id = Column(String(20), ForeignKey("book_copies.id"))
    librarian_id = Column(Integer, ForeignKey("users.id"))
    borrow_date = Column(DateTime, default=datetime.utcnow)
    return_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="Borrowing") # Borrowing, Returned
