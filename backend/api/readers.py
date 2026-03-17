from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from api.deps import get_db, get_current_active_user
from models.user import User
import schemas
from services import reader_service, report_service
from fastapi.responses import StreamingResponse

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

@router.get("/export")
def export_readers(
    file_format: str = Query("excel", description="Định dạng xuất: 'excel' hoặc 'csv'"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo Mã ĐG, Họ tên hoặc Lớp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Xuất danh sách Độc giả ra file Excel/CSV"""
    # Lấy toàn bộ danh sách (không giới hạn phân trang)
    readers = reader_service.get_all_readers(db=db, skip=0, limit=10000, search=search)
    data = []
    for r in readers:
        data.append({
            "id": r.id,
            "full_name": r.full_name,
            "class_name": r.class_name,
            "dob": r.dob,
            "gender": r.gender,
            "is_active": r.is_active
        })
        
    if file_format == "csv":
        output = report_service.export_to_csv(data, report_type="readers")
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=readers_data.csv"}
        )
    else:
        output = report_service.export_to_excel(data, report_type="readers")
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=readers_data.xlsx"}
        )

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
