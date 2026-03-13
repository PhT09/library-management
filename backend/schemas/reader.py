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

class ReaderResponse(ReaderCreate, ConfigBase):
    is_active: bool
