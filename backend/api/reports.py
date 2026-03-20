from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from api.deps import get_db, get_current_active_user
from models.user import User
from services import report_service

router = APIRouter(prefix="/reports", tags=["Báo cáo Thống kê"])

# ====================== XEM BÁO CÁO ======================

@router.get("/top-books")
def get_top_borrowed_books(
    start_date: Optional[date] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    limit: int = 10, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Trả về danh sách các đầu sách được mượn nhiều nhất (Top Trend)"""
    return report_service.get_top_borrowed_books(db=db, limit=limit, start_date=start_date, end_date=end_date)

@router.get("/unreturned-readers")
def get_unreturned_readers(
    start_date: Optional[date] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Trả về danh sách tất cả các độc giả đang mượn sách chưa trả"""
    return report_service.get_unreturned_readers(db=db, start_date=start_date, end_date=end_date)

# ====================== XUẤT FILE BÁO CÁO ======================

@router.get("/top-books/export")
def export_top_borrowed_books(
    start_date: Optional[date] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    limit: int = 10,
    file_format: str = Query("excel", description="Định dạng xuất: 'excel' hoặc 'csv'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Xuất báo cáo Top sách mượn nhiều ra file Excel/CSV"""
    data = report_service.get_top_borrowed_books(db=db, limit=limit, start_date=start_date, end_date=end_date)
    
    if file_format == "csv":
        output = report_service.export_to_csv(data, report_type="top_books")
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=top_books_report.csv"}
        )
    else:
        output = report_service.export_to_excel(data, report_type="top_books")
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=top_books_report.xlsx"}
        )

@router.get("/unreturned-readers/export")
def export_unreturned_readers(
    start_date: Optional[date] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    file_format: str = Query("excel", description="Định dạng xuất: 'excel' hoặc 'csv'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Xuất báo cáo Độc giả nợ sách ra file Excel/CSV"""
    data = report_service.get_unreturned_readers(db=db, start_date=start_date, end_date=end_date)
    
    if file_format == "csv":
        output = report_service.export_to_csv(data, report_type="unreturned_readers")
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=unreturned_readers_report.csv"}
        )
    else:
        output = report_service.export_to_excel(data, report_type="unreturned_readers")
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=unreturned_readers_report.xlsx"}
        )
