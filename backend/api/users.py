from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from api.deps import get_db, get_current_active_admin
from schemas.user import UserCreate, UserUpdate, UserResponse
from models.user import User
from services import user_service

router = APIRouter(prefix="/librarians", tags=["Quản lý Thủ thư"])

@router.get("/", response_model=list[UserResponse])
def get_all_librarians(
    skip: int = 0, 
    limit: int = 100, 
    full_name: Optional[str] = Query(None, description="Tìm kiếm theo Tên Thủ thư"),
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_active_admin)
):
    """
    Lấy danh sách tất cả Thủ thư.
    Có thể lọc theo tên thủ thư bằng cách truyền full_name.
    Chỉ Admin mới có quyền gọi API này (thông qua Dependency `get_current_active_admin`).
    """
    return user_service.get_librarians(db=db, skip=skip, limit=limit, full_name=full_name)

@router.post("/", response_model=UserResponse)
def create_librarian(
    user_in: UserCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)
):
    """
    Tạo mới một tài khoản Thủ thư.
    Admin cần cung cấp thông tin (username, mật khẩu tạm cơ bản, họ tên).
    """
    return user_service.create_librarian(db, user_in)

@router.patch("/{librarian_id}", response_model=UserResponse)
def update_librarian(
    librarian_id: int, user_in: UserUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)
):
    """
    Cập nhật hồ sơ (đổi tên, mật khẩu, trạng thái active) của Thủ thư.
    API nghiêm cấm việc sửa đổi ID Thủ thư vì tính toàn vẹn dữ liệu.
    """
    return user_service.update_librarian(db, librarian_id, user_in)

@router.delete("/{librarian_id}")
def delete_librarian(
    librarian_id: int, target_librarian_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_active_admin)
):
    """
    Thao tác xóa (vô hiệu hóa) một Thủ thư.
    YÊU CẦU: Truyền thêm `target_librarian_id` là ID của tài khoản thụ hưởng dữ liệu bị chuyển giao.
    Nếu đây là "Backup Librarian" cuối cùng, API sẽ trả về lỗi chặn thao tác xóa.
    """
    return user_service.delete_librarian_and_reassign(db, librarian_id, target_librarian_id)
