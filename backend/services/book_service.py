from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import models
import schemas

# ====================== CHUYÊN NGÀNH ======================

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

def get_categories_with_stats(db: Session):
    """
    Trả về danh sách Chuyên ngành kèm thống kê:
    - book_count: số lượng đầu sách
    - copy_count: tổng số lượng bản sao sách
    """
    categories = db.query(models.Category).all()
    result = []
    for cat in categories:
        book_count = db.query(func.count(models.Book.id)).filter(
            models.Book.category_id == cat.id
        ).scalar()
        
        copy_count = db.query(func.count(models.BookCopy.id)).join(
            models.Book, models.BookCopy.book_id == models.Book.id
        ).filter(
            models.Book.category_id == cat.id
        ).scalar()
        
        result.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "book_count": book_count,
            "copy_count": copy_count
        })
    return result

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

# ====================== ĐẦU SÁCH ======================

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
    """Lấy tất cả đầu sách kèm số lượng bản sao available"""
    books = db.query(models.Book).all()
    result = []
    for book in books:
        total_copies = db.query(func.count(models.BookCopy.id)).filter(
            models.BookCopy.book_id == book.id
        ).scalar()
        available_copies = db.query(func.count(models.BookCopy.id)).filter(
            models.BookCopy.book_id == book.id,
            models.BookCopy.status == "Available"
        ).scalar()
        result.append({
            "id": book.id,
            "name": book.name,
            "publisher": book.publisher,
            "size": book.size,
            "author": book.author,
            "category_id": book.category_id,
            "total_copies": total_copies,
            "available_copies": available_copies
        })
    return result

def search_books(db: Session, q: str):
    """Tìm kiếm sách cho Thủ thư (đã đăng nhập)"""
    search = f"%{q}%"
    return db.query(models.Book).join(models.Category).filter(
        (models.Book.name.ilike(search)) |
        (models.Book.author.ilike(search)) |
        (models.Category.name.ilike(search))
    ).all()

def search_books_public(db: Session, q: str):
    """
    Tra cứu sách công khai cho Sinh viên (KHÔNG cần đăng nhập).
    Trả về: Mã sách, Tên sách, Tác giả, Chuyên ngành, Số lượng có sẵn.
    """
    search = f"%{q}%"
    books = db.query(models.Book).join(models.Category).filter(
        (models.Book.name.ilike(search)) |
        (models.Book.author.ilike(search)) |
        (models.Category.name.ilike(search))
    ).all()
    
    result = []
    for book in books:
        available_copies = db.query(func.count(models.BookCopy.id)).filter(
            models.BookCopy.book_id == book.id,
            models.BookCopy.status == "Available"
        ).scalar()
        
        category = db.query(models.Category).filter(models.Category.id == book.category_id).first()
        
        result.append({
            "book_id": book.id,
            "book_name": book.name,
            "author": book.author,
            "publisher": book.publisher,
            "category_name": category.name if category else None,
            "available_copies": available_copies
        })
    return result

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

# ====================== BẢN SAO SÁCH ======================

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

def get_book_copies_by_book(db: Session, book_id: str):
    """Lấy danh sách tất cả bản sao của 1 đầu sách cụ thể"""
    db_book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Không tìm thấy Đầu sách!")
    return db.query(models.BookCopy).filter(models.BookCopy.book_id == book_id).all()

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
