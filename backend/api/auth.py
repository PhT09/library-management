from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_user
from core.config import settings
from core.security import verify_password, create_access_token
from models.user import User
from schemas.token import Token
from schemas.user import UserResponse
from schemas.password_reset import ForgotPasswordRequest
from models.password_reset import PasswordResetTicket

router = APIRouter(tags=["Authentication"])

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, nhận username và password.
    Kiểm tra hash mật khẩu, nếu đúng sẽ sinh và trả về JWT định dạng Bearer.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    pending_ticket = db.query(PasswordResetTicket).filter(
        PasswordResetTicket.user_id == user.id,
        PasswordResetTicket.status == "pending"
    ).first()
    
    if pending_ticket:
        raise HTTPException(status_code=403, detail="Tài khoản đang có yêu cầu đổi mật khẩu. Không thể đăng nhập vào lúc này.")


    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@router.get("/login/test-token", response_model=UserResponse)
def test_token(current_user: User = Depends(get_current_user)) -> User:
    """
    Test access token
    """
    return current_user

@router.post("/forgot-password")
def request_password_reset(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Yêu cầu lấy lại mật khẩu.
    - Admin: Yêu cầu liên hệ lập trình viên.
    - Librarian: Tạo ticket reset trong CSDL.
    """
    user = db.query(User).filter(
        (User.username == request.identifier) | (User.full_name == request.identifier)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role == "admin":
        return {"message": "Please contact the system developer for a password reset"}
        
    pending_ticket = db.query(PasswordResetTicket).filter(
        PasswordResetTicket.user_id == user.id,
        PasswordResetTicket.status == "pending"
    ).first()
    
    if pending_ticket:
        raise HTTPException(status_code=400, detail="Tài khoản này đang có một yêu cầu tạo mới mật khẩu chờ xử lý. Vui lòng đợi tài khoản quản trị viên phê duyệt trước khi tạo yêu cầu mới.")
        
    ticket = PasswordResetTicket(user_id=user.id, reason=request.reason)
    db.add(ticket)
    db.commit()
    
    return {"message": "Password reset request submitted successfully. Please wait for admin approval."}
