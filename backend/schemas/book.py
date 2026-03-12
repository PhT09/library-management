from pydantic import BaseModel
from datetime import date
from schemas.base import ConfigBase

class CategoryCreate(BaseModel):
    id: str
    name: str
    description: str

class CategoryResponse(CategoryCreate, ConfigBase):
    pass

class BookCreate(BaseModel):
    id: str
    name: str
    publisher: str
    size: str
    author: str
    category_id: str

class BookResponse(BookCreate, ConfigBase):
    pass

class BookCopyCreate(BaseModel):
    id: str
    book_id: str
    condition: str = "Mới"
    import_date: date
    status: str = "Available"

class BookCopyResponse(BookCopyCreate, ConfigBase):
    pass
