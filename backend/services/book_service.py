from sqlalchemy.orm import Session
from fastapi import HTTPException
import models
import schemas

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = db.query(models.Category).filter(models.Category.id == category.id).first()
    if db_category:
        raise HTTPException(status_code=400, detail="Mã Chuyên ngành đã tồn tại!")
    new_category = models.Category(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

def get_all_categories(db: Session):
    return db.query(models.Category).all()

def create_book(db: Session, book: schemas.BookCreate):
    db_book = db.query(models.Book).filter(models.Book.id == book.id).first()
    if db_book:
        raise HTTPException(status_code=400, detail="Mã Sách đã tồn tại!")
    db_category = db.query(models.Category).filter(models.Category.id == book.category_id).first()
    if not db_category:
        raise HTTPException(status_code=400, detail="Mã Chuyên ngành không tồn tại!")
    new_book = models.Book(**book.dict())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

def get_all_books(db: Session):
    return db.query(models.Book).all()

def create_book_copy(db: Session, copy: schemas.BookCopyCreate):
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == copy.id).first()
    if db_copy:
        raise HTTPException(status_code=400, detail="Mã Bản sao đã tồn tại!")
    db_book = db.query(models.Book).filter(models.Book.id == copy.book_id).first()
    if not db_book:
        raise HTTPException(status_code=400, detail="Mã Sách gốc không tồn tại!")
    new_copy = models.BookCopy(**copy.dict())
    db.add(new_copy)
    db.commit()
    db.refresh(new_copy)
    return new_copy

def get_all_book_copies(db: Session):
    return db.query(models.BookCopy).all()

def update_category(db: Session, category_id: str, category_update: schemas.CategoryUpdate):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Không tìm thấy Chuyên ngành!")
    update_data = category_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: str):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Không tìm thấy Chuyên ngành!")
    if db_category.books:
        raise HTTPException(status_code=400, detail="Không thể xóa vì còn Đầu sách thuộc chuyên ngành này!")
    db.delete(db_category)
    db.commit()
    return {"detail": "Xóa Chuyên ngành thành công!"}

def search_books(db: Session, q: str):
    search = f"%{q}%"
    return db.query(models.Book).join(models.Category).filter(
        (models.Book.name.ilike(search)) |
        (models.Book.author.ilike(search)) |
        (models.Category.name.ilike(search))
    ).all()

def update_book(db: Session, book_id: str, book_update: schemas.BookUpdate):
    db_book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Không tìm thấy Sách!")
    if book_update.category_id:
        db_category = db.query(models.Category).filter(models.Category.id == book_update.category_id).first()
        if not db_category:
            raise HTTPException(status_code=400, detail="Mã Chuyên ngành không tồn tại!")
    
    update_data = book_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: str):
    db_book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Không tìm thấy Sách!")
    if db_book.copies:
        raise HTTPException(status_code=400, detail="Không thể xóa vì Sách này đã có các bản sao vật lý!")
    db.delete(db_book)
    db.commit()
    return {"detail": "Xóa Sách thành công!"}

def update_book_copy(db: Session, copy_id: str, copy_update: schemas.BookCopyUpdate):
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == copy_id).first()
    if not db_copy:
        raise HTTPException(status_code=404, detail="Không tìm thấy Bản sao sách!")
    update_data = copy_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_copy, key, value)
    db.commit()
    db.refresh(db_copy)
    return db_copy

def delete_book_copy(db: Session, copy_id: str):
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == copy_id).first()
    if not db_copy:
        raise HTTPException(status_code=404, detail="Không tìm thấy Bản sao sách!")
    
    active_borrows = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.book_copy_id == copy_id,
        models.BorrowRecord.status == "Borrowing"
    ).first()
    if active_borrows:
        raise HTTPException(status_code=400, detail="Bản sao này đang được mượn, không thể xóa!")
    
    db.delete(db_copy)
    db.commit()
    return {"detail": "Xóa Bản sao sách thành công!"}
