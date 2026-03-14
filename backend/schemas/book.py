from pydantic import BaseModel
from datetime import date
from typing import Optional
from schemas.base import ConfigBase

class CategoryCreate(BaseModel):
    id: str
    name: str
    description: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(CategoryCreate, ConfigBase):
    pass

class BookCreate(BaseModel):
    id: str
    name: str
    publisher: str
    size: str
    author: str
    category_id: str

class BookUpdate(BaseModel):
    name: Optional[str] = None
    publisher: Optional[str] = None
    size: Optional[str] = None
    author: Optional[str] = None
    category_id: Optional[str] = None

class BookResponse(BookCreate, ConfigBase):
    pass

class BookCopyCreate(BaseModel):
    id: str
    book_id: str
    condition: str = "Mới"
    import_date: date
    status: str = "Available"

class BookCopyUpdate(BaseModel):
    condition: Optional[str] = None
    status: Optional[str] = None

class BookCopyResponse(BookCopyCreate, ConfigBase):
    pass
