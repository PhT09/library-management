from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from api.deps import get_db, get_current_active_user
from models.user import User
import schemas
from services import reader_service

router = APIRouter(prefix="/readers", tags=["Quản lý Độc giả"])

@router.post("/", response_model=schemas.ReaderResponse)
def create_reader(
    reader: schemas.ReaderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Thêm mới Độc giả (Thủ thư thao tác)"""
    return reader_service.create_reader(db=db, reader=reader)

@router.get("/")
def get_all_readers(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = Query(None, description="Tìm kiếm theo Mã ĐG, Họ tên hoặc Lớp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Xem danh sách Độc giả, hỗ trợ tìm kiếm"""
    return reader_service.get_all_readers(db=db, skip=skip, limit=limit, search=search)

@router.get("/{reader_id}", response_model=schemas.ReaderResponse)
def get_reader(
    reader_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Tìm Độc giả theo Mã ĐG"""
    return reader_service.get_reader_by_id(db=db, reader_id=reader_id)

@router.put("/{reader_id}", response_model=schemas.ReaderResponse)
def update_reader(
    reader_id: str, 
    reader_update: schemas.ReaderUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Sửa thông tin Độc giả"""
    return reader_service.update_reader(db=db, reader_id=reader_id, reader_update=reader_update)

@router.patch("/{reader_id}/toggle-status")
def toggle_reader_status(reader_id: str, db: Session = Depends(get_db)):
    return reader_service.toggle_reader_status(db=db, reader_id=reader_id)

@router.delete("/{reader_id}")
def delete_reader(
    reader_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Thu hồi (vô hiệu hóa) thẻ Độc giả"""
    return reader_service.delete_reader(db=db, reader_id=reader_id)
