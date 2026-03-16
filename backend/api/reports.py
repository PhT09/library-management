from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from db.session import get_db
from services import report_service

router = APIRouter(prefix="/reports", tags=["Báo cáo Thống kê"])

@router.get("/top-books")
def get_top_borrowed_books(
    start_date: Optional[date] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    """Trả về danh sách 10 đầu sách được mượn nhiều nhất"""
    return report_service.get_top_borrowed_books(db=db, limit=limit, start_date=start_date, end_date=end_date)

@router.get("/unreturned-readers")
def get_unreturned_readers(
    start_date: Optional[date] = Query(None, description="Ngày bắt đầu (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Ngày kết thúc (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Trả về danh sách tất cả các độc giả đang mượn sách thuộc tình trạng Chưa Trả"""
    return report_service.get_unreturned_readers(db=db, start_date=start_date, end_date=end_date)
