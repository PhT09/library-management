from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
import schemas
from services import book_service

router = APIRouter(tags=["Quản lý Sách"])

@router.post("/categories/", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return book_service.create_category(db=db, category=category)

@router.get("/categories/")
def get_all_categories(db: Session = Depends(get_db)):
    return book_service.get_all_categories(db=db)

@router.post("/books/", response_model=schemas.BookResponse)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    return book_service.create_book(db=db, book=book)

@router.get("/books/")
def get_all_books(db: Session = Depends(get_db)):
    return book_service.get_all_books(db=db)

@router.post("/book-copies/", response_model=schemas.BookCopyResponse)
def create_book_copy(copy: schemas.BookCopyCreate, db: Session = Depends(get_db)):
    return book_service.create_book_copy(db=db, copy=copy)

@router.get("/book-copies/")
def get_all_book_copies(db: Session = Depends(get_db)):
    return book_service.get_all_book_copies(db=db)
