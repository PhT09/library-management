from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from services import borrow_service

router = APIRouter(tags=["Quản lý Mượn Trả"])

@router.post("/borrow/")
def borrow_book(reader_id: str, book_copy_id: str, librarian_id: int = 1, db: Session = Depends(get_db)):
    return borrow_service.borrow_book(db=db, reader_id=reader_id, book_copy_id=book_copy_id, librarian_id=librarian_id)

@router.post("/return/{borrow_id}")
def return_book(borrow_id: int, db: Session = Depends(get_db)):
    return borrow_service.return_book(db=db, borrow_id=borrow_id)

@router.get("/borrows")
def get_borrows(reader_id: str = None, status: str = None, db: Session = Depends(get_db)):
    return borrow_service.get_borrows(db=db, reader_id=reader_id, status=status)
