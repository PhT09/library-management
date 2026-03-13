from pydantic import BaseModel
from schemas.base import ConfigBase

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "librarian"

class UserResponse(ConfigBase):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
