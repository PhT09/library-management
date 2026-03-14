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

@router.put("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: str, category_update: schemas.CategoryUpdate, db: Session = Depends(get_db)):
    return book_service.update_category(db=db, category_id=category_id, category_update=category_update)

@router.delete("/categories/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db)):
    return book_service.delete_category(db=db, category_id=category_id)

@router.post("/books/", response_model=schemas.BookResponse)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    return book_service.create_book(db=db, book=book)

@router.get("/books/")
def get_all_books(db: Session = Depends(get_db)):
    return book_service.get_all_books(db=db)

@router.get("/books/search")
def search_books(q: str, db: Session = Depends(get_db)):
    return book_service.search_books(db=db, q=q)

@router.put("/books/{book_id}", response_model=schemas.BookResponse)
def update_book(book_id: str, book_update: schemas.BookUpdate, db: Session = Depends(get_db)):
    return book_service.update_book(db=db, book_id=book_id, book_update=book_update)

@router.delete("/books/{book_id}")
def delete_book(book_id: str, db: Session = Depends(get_db)):
    return book_service.delete_book(db=db, book_id=book_id)

@router.post("/book-copies/", response_model=schemas.BookCopyResponse)
def create_book_copy(copy: schemas.BookCopyCreate, db: Session = Depends(get_db)):
    return book_service.create_book_copy(db=db, copy=copy)

@router.get("/book-copies/")
def get_all_book_copies(db: Session = Depends(get_db)):
    return book_service.get_all_book_copies(db=db)

@router.put("/book-copies/{copy_id}", response_model=schemas.BookCopyResponse)
def update_book_copy(copy_id: str, copy_update: schemas.BookCopyUpdate, db: Session = Depends(get_db)):
    return book_service.update_book_copy(db=db, copy_id=copy_id, copy_update=copy_update)

@router.delete("/book-copies/{copy_id}")
def delete_book_copy(copy_id: str, db: Session = Depends(get_db)):
    return book_service.delete_book_copy(db=db, copy_id=copy_id)
