from pydantic import BaseModel
from schemas.base import ConfigBase
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "librarian"

class UserUpdate(BaseModel):
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(ConfigBase):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
