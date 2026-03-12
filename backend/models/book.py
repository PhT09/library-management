from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from db.session import Base

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
