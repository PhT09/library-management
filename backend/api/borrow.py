from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from api.deps import get_db, get_current_active_user
from models.user import User
from services import borrow_service

router = APIRouter(prefix="/borrows", tags=["Quản lý Mượn Trả"])

# ====================== MƯỢN SÁCH ======================

@router.post("/")
def borrow_book(
    reader_id: str, 
    book_copy_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Tạo phiếu mượn sách.
    - Mã Thủ thư tự động lấy từ tài khoản đang đăng nhập.
    - Kiểm tra: Mỗi ĐG chỉ được mượn 1 cuốn/lần.
    - Kiểm tra: Bản sao sách phải Available.
    """
    return borrow_service.borrow_book(
        db=db, 
        reader_id=reader_id, 
        book_copy_id=book_copy_id, 
        librarian_id=current_user.id
    )

# ====================== TRẢ SÁCH ======================

@router.post("/return/{borrow_id}")
def return_book(
    borrow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Xác nhận trả sách, cập nhật trạng thái phiếu mượn và bản sao sách"""
    return borrow_service.return_book(db=db, borrow_id=borrow_id)

# ====================== XEM PHIẾU MƯỢN ======================

@router.get("/records")
def get_borrows(
    reader_id: Optional[str] = Query(None, description="Lọc theo Mã Độc giả"),
    book_copy_id: Optional[str] = Query(None, description="Lọc theo Mã Bản sao sách"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái: Borrowing hoặc Returned"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Xem danh sách phiếu mượn.
    Hỗ trợ tìm kiếm theo: Mã ĐG, Mã bản sao sách, Trạng thái.
    """
    return borrow_service.get_borrows(
        db=db, 
        reader_id=reader_id, 
        book_copy_id=book_copy_id, 
        status=status
    )
