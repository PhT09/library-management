from datetime import date
from db.session import SessionLocal
from models.book import Category, Book, BookCopy
from models.reader import Reader

def seed_data():
    db = SessionLocal()

    # Create Categories
    categories = [
        Category(id="CNTT", name="Công nghệ thông tin", description="Sách về máy tính và phần mềm"),
        Category(id="KT", name="Kinh tế", description="Sách kinh tế học và quản trị kinh doanh"),
        Category(id="VH", name="Văn học", description="Tiểu thuyết, truyện ngắn, thơ ca"),
    ]
    for c in categories:
        if not db.query(Category).filter_by(id=c.id).first():
            db.add(c)
    
    db.commit()

    # Create Books
    books = [
        Book(id="B001", name="Cấu trúc dữ liệu và giải thuật", publisher="NXB Giáo dục", size="16x24", author="Nguyễn Văn A", category_id="CNTT"),
        Book(id="B002", name="Nhập môn Trí tuệ nhân tạo", publisher="NXB Đại học Quốc gia", size="16x24", author="Trần Thị B", category_id="CNTT"),
        Book(id="B003", name="Kinh tế học vĩ mô", publisher="NXB Kinh tế", size="14.5x20.5", author="Lê Văn C", category_id="KT"),
        Book(id="B004", name="Nhật ký trong tù", publisher="NXB Văn học", size="13x19", author="Hồ Chí Minh", category_id="VH"),
    ]
    for b in books:
        if not db.query(Book).filter_by(id=b.id).first():
            db.add(b)

    db.commit()

    # Create Book Copies
    copies = [
        BookCopy(id="C001", book_id="B001", condition="Mới", import_date=date(2023, 1, 15), status="Available"),
        BookCopy(id="C002", book_id="B001", condition="Hơi rách", import_date=date(2023, 1, 15), status="Available"),
        BookCopy(id="C003", book_id="B002", condition="Mới", import_date=date(2023, 5, 20), status="Available"),
        BookCopy(id="C004", book_id="B003", condition="Tốt", import_date=date(2022, 10, 10), status="Available"),
        BookCopy(id="C005", book_id="B004", condition="Mới", import_date=date(2024, 2, 5), status="Available"),
    ]
    for c in copies:
        if not db.query(BookCopy).filter_by(id=c.id).first():
            db.add(c)
            
    db.commit()

    # Create Readers
    readers = [
        Reader(id="DG001", full_name="Nguyễn Hữu Trí", class_name="KTPM2021", dob=date(2003, 5, 12), gender="Nam", is_active=True),
        Reader(id="DG002", full_name="Lê Thu Hà", class_name="KTQT2022", dob=date(2004, 10, 24), gender="Nữ", is_active=True),
        Reader(id="DG003", full_name="Trần Minh Quân", class_name="HTTT2021", dob=date(2003, 1, 8), gender="Nam", is_active=True),
        Reader(id="DG004", full_name="Phạm Mai Phương", class_name="NNA2023", dob=date(2005, 7, 30), gender="Nữ", is_active=True),
    ]
    for r in readers:
         if not db.query(Reader).filter_by(id=r.id).first():
             db.add(r)
             
    db.commit()
    db.close()
    print("Seed dữ liệu thành công!")

if __name__ == "__main__":
    seed_data()
