from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

# Import các file
from database import engine, get_db
import models
import schemas

# Sinh DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Library Management API",
    description="Backend API cho Hệ thống Quản lý Thư viện Đại học",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Server đang chạy! DataBase đã được kết nối."}

# ======== API QUẢN LÝ ĐỘC GIẢ ========
@app.post("/readers/", response_model=schemas.ReaderResponse, tags=["Quản lý Độc giả"])
def create_reader(reader: schemas.ReaderCreate, db: Session = Depends(get_db)):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader.id).first()
    if db_reader:
        raise HTTPException(status_code=400, detail="Mã Độc giả đã tồn tại!")
    new_reader = models.Reader(**reader.dict())
    db.add(new_reader)
    db.commit()
    db.refresh(new_reader)
    return new_reader

@app.get("/readers/", tags=["Quản lý Độc giả"])
def get_all_readers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Reader).offset(skip).limit(limit).all()


# ======== API QUẢN LÝ CHUYÊN NGÀNH VÀ SÁCH ========
@app.post("/categories/", response_model=schemas.CategoryResponse, tags=["Quản lý Sách"])
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category.id).first()
    if db_category:
        raise HTTPException(status_code=400, detail="Mã Chuyên ngành đã tồn tại!")
    new_category = models.Category(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@app.get("/categories/", tags=["Quản lý Sách"])
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.post("/books/", response_model=schemas.BookResponse, tags=["Quản lý Sách"])
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    db_book = db.query(models.Book).filter(models.Book.id == book.id).first()
    if db_book:
        raise HTTPException(status_code=400, detail="Mã Sách đã tồn tại!")
    # Kiểm tra chuyên ngành có tồn tại không
    db_category = db.query(models.Category).filter(models.Category.id == book.category_id).first()
    if not db_category:
        raise HTTPException(status_code=400, detail="Mã Chuyên ngành không tồn tại!")
        
    new_book = models.Book(**book.dict())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@app.get("/books/", tags=["Quản lý Sách"])
def get_all_books(db: Session = Depends(get_db)):
    return db.query(models.Book).all()

@app.post("/book-copies/", response_model=schemas.BookCopyResponse, tags=["Quản lý Sách"])
def create_book_copy(copy: schemas.BookCopyCreate, db: Session = Depends(get_db)):
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == copy.id).first()
    if db_copy:
        raise HTTPException(status_code=400, detail="Mã Bản sao đã tồn tại!")
    # Kiểm tra sách gốc có không
    db_book = db.query(models.Book).filter(models.Book.id == copy.book_id).first()
    if not db_book:
        raise HTTPException(status_code=400, detail="Mã Sách gốc không tồn tại!")
        
    new_copy = models.BookCopy(**copy.dict())
    db.add(new_copy)
    db.commit()
    db.refresh(new_copy)
    return new_copy

@app.get("/book-copies/", tags=["Quản lý Sách"])
def get_all_book_copies(db: Session = Depends(get_db)):
    return db.query(models.BookCopy).all()


# ======== API QUẢN LÝ MƯỢN TRẢ ========
@app.post("/borrow/", tags=["Quản lý Mượn Trả"])
def borrow_book(reader_id: str, book_copy_id: str, librarian_id: int = 1, db: Session = Depends(get_db)):
    # 1. Kiểm tra Độc giả có đang mượn sách chưa trả không (Luật: 1 lần mượn 1 cuốn)
    active_borrow = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.reader_id == reader_id,
        models.BorrowRecord.status == "Borrowing"
    ).first()
    if active_borrow:
         raise HTTPException(status_code=400, detail="Độc giả này đang mượn 1 cuốn chưa trả. Vui lòng trả sách trước khi mượn mới!")
    
    # 2. Kiểm tra Bản sao sách có trong kho (Available) không
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == book_copy_id).first()
    if not db_copy:
         raise HTTPException(status_code=404, detail="Không tìm thấy mã bản sao sách này!")
    if db_copy.status != "Available":
         raise HTTPException(status_code=400, detail="Cuốn sách này đã có người mượn hoặc không sẵn sàng!")
         
    # 3. Tạo phiếu mượn & Cập nhật trạng thái sách
    db_copy.status = "Borrowed"
    new_record = models.BorrowRecord(
        reader_id=reader_id,
        book_copy_id=book_copy_id,
        librarian_id=librarian_id,
        status="Borrowing"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {"message": "Tạo phiếu mượn thành công!", "borrow_id": new_record.id}

@app.post("/return/{borrow_id}", tags=["Quản lý Mượn Trả"])
def return_book(borrow_id: int, db: Session = Depends(get_db)):
    # Tìm phiếu mượn
    record = db.query(models.BorrowRecord).filter(models.BorrowRecord.id == borrow_id).first()
    if not record or record.status == "Returned":
        raise HTTPException(status_code=400, detail="Phiếu mượn không tồn tại hoặc đã trả sách!")
        
    # Cập nhật phiếu mượn
    record.status = "Returned"
    record.return_date = datetime.utcnow()
    
    # Cập nhật lại kho sách
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == record.book_copy_id).first()
    if db_copy:
        db_copy.status = "Available"
        
    db.commit()
    return {"message": "Xác nhận trả sách thành công, đã xếp lại vào kho!"}

