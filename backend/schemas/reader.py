from pydantic import BaseModel
from typing import Optional
from datetime import date
from schemas.base import ConfigBase

class ReaderCreate(BaseModel):
    id: str
    full_name: str
    class_name: str
    dob: date
    gender: str

class ReaderUpdate(BaseModel):
    full_name: Optional[str] = None
    class_name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    is_active: Optional[bool] = None

class ReaderResponse(ReaderCreate, ConfigBase):
    is_active: bool
