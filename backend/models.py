from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))
    full_name = Column(String(100))
    role = Column(String(20), default="librarian") # admin hoặc librarian
    is_active = Column(Boolean, default=True)

class Reader(Base):
    __tablename__ = "readers"
    id = Column(String(20), primary_key=True, index=True) # Mã ĐG
    full_name = Column(String(100))
    class_name = Column(String(50))
    dob = Column(Date)
    gender = Column(String(10))
    is_active = Column(Boolean, default=True)

class Category(Base):
    __tablename__ = "categories"
    id = Column(String(20), primary_key=True, index=True) # Mã Chuyên ngành
    name = Column(String(100))
    description = Column(String(255))
    
    books = relationship("Book", back_populates="category")

class Book(Base):
    __tablename__ = "books"
    id = Column(String(20), primary_key=True, index=True) # Mã Sách
    name = Column(String(200))
    publisher = Column(String(100))
    size = Column(String(50))
    author = Column(String(100))
    category_id = Column(String(20), ForeignKey("categories.id"))

    category = relationship("Category", back_populates="books")
    copies = relationship("BookCopy", back_populates="book")

class BookCopy(Base):
    __tablename__ = "book_copies"
    id = Column(String(20), primary_key=True, index=True) # Mã Bản Sao
    book_id = Column(String(20), ForeignKey("books.id"))
    condition = Column(String(50)) # Tình trạng: Mới, Rách, ...
    import_date = Column(Date)
    status = Column(String(20), default="Available") # Available, Borrowed, Lost

    book = relationship("Book", back_populates="copies")

class BorrowRecord(Base):
    __tablename__ = "borrow_records"
    id = Column(Integer, primary_key=True, index=True)
    reader_id = Column(String(20), ForeignKey("readers.id"))
    book_copy_id = Column(String(20), ForeignKey("book_copies.id"))
    librarian_id = Column(Integer, ForeignKey("users.id"))
    borrow_date = Column(DateTime, default=datetime.utcnow)
    return_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="Borrowing") # Borrowing, Returned
