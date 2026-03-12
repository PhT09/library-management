from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ConfigBase(BaseModel):
    class Config:
        from_attributes = True

# 1. Schemas cho User (Quản lý Thủ Thư)
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

# 2. Schemas cho Độc Giả
class ReaderCreate(BaseModel):
    id: str
    full_name: str
    class_name: str
    dob: date
    gender: str

class ReaderResponse(ReaderCreate, ConfigBase):
    is_active: bool

# 3. Schemas cho Chuyên Ngành
class CategoryCreate(BaseModel):
    id: str
    name: str
    description: str

class CategoryResponse(CategoryCreate, ConfigBase):
    pass

# 4. Schemas cho Book (Đầu Sách)
class BookCreate(BaseModel):
    id: str
    name: str
    publisher: str
    size: str
    author: str
    category_id: str

class BookResponse(BookCreate, ConfigBase):
    pass

# 5. Schemas cho Bản Sao (Book Copy)
class BookCopyCreate(BaseModel):
    id: str
    book_id: str
    condition: str = "Mới"
    import_date: date
    status: str = "Available"

class BookCopyResponse(BookCopyCreate, ConfigBase):
    pass

