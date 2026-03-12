from sqlalchemy.orm import Session
from fastapi import HTTPException
import models
import schemas

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = db.query(models.Category).filter(models.Category.id == category.id).first()
    if db_category:
        raise HTTPException(status_code=400, detail="Mã Chuyên ngành đã tồn tại!")
    new_category = models.Category(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

def get_all_categories(db: Session):
    return db.query(models.Category).all()

def create_book(db: Session, book: schemas.BookCreate):
    db_book = db.query(models.Book).filter(models.Book.id == book.id).first()
    if db_book:
        raise HTTPException(status_code=400, detail="Mã Sách đã tồn tại!")
    db_category = db.query(models.Category).filter(models.Category.id == book.category_id).first()
    if not db_category:
        raise HTTPException(status_code=400, detail="Mã Chuyên ngành không tồn tại!")
    new_book = models.Book(**book.dict())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

def get_all_books(db: Session):
    return db.query(models.Book).all()

def create_book_copy(db: Session, copy: schemas.BookCopyCreate):
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == copy.id).first()
    if db_copy:
        raise HTTPException(status_code=400, detail="Mã Bản sao đã tồn tại!")
    db_book = db.query(models.Book).filter(models.Book.id == copy.book_id).first()
    if not db_book:
        raise HTTPException(status_code=400, detail="Mã Sách gốc không tồn tại!")
    new_copy = models.BookCopy(**copy.dict())
    db.add(new_copy)
    db.commit()
    db.refresh(new_copy)
    return new_copy

def get_all_book_copies(db: Session):
    return db.query(models.BookCopy).all()
