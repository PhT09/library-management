from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from db.session import get_db
from services import book_service

router = APIRouter(prefix="/public", tags=["Tra cứu công khai (Sinh viên)"])

@router.get("/books/search")
def public_search_books(
    q: str = Query(..., description="Tìm kiếm theo Tên sách, Tác giả hoặc Chuyên ngành"),
    db: Session = Depends(get_db)
):
    """
    Tra cứu sách công khai cho Sinh viên / Độc giả.
    KHÔNG yêu cầu đăng nhập.
    Trả về danh sách sách phù hợp để sinh viên lấy Mã sách ghi vào phiếu yêu cầu.
    """
    return book_service.search_books_public(db=db, q=q)

@router.get("/categories")
def get_public_categories(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả chuyên ngành công khai"""
    return book_service.get_all_categories(db=db)

@router.get("/authors")
def get_public_authors(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả tác giả công khai"""
    return book_service.get_all_authors(db=db)

@router.get("/publishers")
def get_public_publishers(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả nhà xuất bản công khai"""
    return book_service.get_all_publishers(db=db)
