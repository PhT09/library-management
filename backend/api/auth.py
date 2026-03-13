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
