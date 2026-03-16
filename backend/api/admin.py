from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_active_admin
from models.user import User
from models.password_reset import PasswordResetTicket
from schemas.password_reset import ResetTicketResponse, ResetTicketProcessRequest
from core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Password Reset Management"])

@router.get("/reset-tickets", response_model=list[ResetTicketResponse])
def get_reset_tickets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    """
    Lấy danh sách các yêu cầu cấp lại mật khẩu đang chờ xử lý (pending).
    """
    tickets = db.query(PasswordResetTicket).filter(
        PasswordResetTicket.status == "pending"
    ).offset(skip).limit(limit).all()
    return tickets

@router.patch("/reset-tickets/{ticket_id}", response_model=ResetTicketResponse)
def process_reset_ticket(
    ticket_id: int,
    request: ResetTicketProcessRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    """
    Xử lý yêu cầu cấp lại mật khẩu.
    - action: "process" (cần cung cấp new_password) hoặc "reject".
    """
    ticket = db.query(PasswordResetTicket).filter(PasswordResetTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.status != "pending":
        raise HTTPException(status_code=400, detail="Ticket is already processed or rejected")
        
    if request.action == "reject":
        ticket.status = "rejected"
    elif request.action == "process":
        if not request.new_password:
            raise HTTPException(status_code=400, detail="new_password is required when processing a ticket")
        
        user = db.query(User).filter(User.id == ticket.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User associated with ticket not found")
            
        user.hashed_password = get_password_hash(request.new_password)
        ticket.status = "processed"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'process' or 'reject'.")
        
    db.commit()
    db.refresh(ticket)
    return ticket
