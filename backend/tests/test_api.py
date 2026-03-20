import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from db.session import get_db, Base
from models.user import User
from core.security import get_password_hash
import datetime

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_api.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Tạo admin user để test authorization
    admin = db.query(User).filter(User.username == "admin_test").first()
    if not admin:
        admin = User(
            username="admin_test",
            hashed_password=get_password_hash("testpass"),
            full_name="Admin Test",
            is_active=True,
            role="admin"
        )
        db.add(admin)
        db.commit()
    
    yield
    # Có thể drop tables sau khi test, nhưng giữ lại cũng ổn
    Base.metadata.drop_all(bind=engine)

def get_admin_token():
    response = client.post("/login", data={"username": "admin_test", "password": "testpass"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return token

def test_create_and_get_reader():
    reader_data = {
        "id": "SV001",
        "full_name": "Nguyen Van A",
        "class_name": "KTPM",
        "dob": "2000-01-01",
        "gender": "Nam"
    }
    # Create
    resp = client.post("/readers/", json=reader_data)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Nguyen Van A"
    
    # Get all
    resp_get = client.get("/readers/")
    assert len(resp_get.json()) > 0
    assert resp_get.json()[0]["id"] == "SV001"

    # Update reader
    resp_update = client.put("/readers/SV001", json={"class_name": "KHMT"})
    assert resp_update.status_code == 200
    assert resp_update.json()["class_name"] == "KHMT"

def test_books_and_categories():
    # Category
    cat_data = {"id": "IT", "name": "Cong Nghe Thong Tin", "description": "Sach CNTT"}
    resp_cat = client.post("/categories/", json=cat_data)
    assert resp_cat.status_code == 200
    
    # Book
    book_data = {
        "id": "B001",
        "name": "Lap Trinh Python",
        "publisher": "NXB A",
        "size": "A4",
        "author": "Tac Gia A",
        "category_id": "IT"
    }
    resp_book = client.post("/books/", json=book_data)
    assert resp_book.status_code == 200
    
    # Book Copy
    copy_data = {
        "id": "CP001",
        "book_id": "B001",
        "condition": "Mới",
        "import_date": "2023-01-01"
    }
    resp_copy = client.post("/book-copies/", json=copy_data)
    assert resp_copy.status_code == 200
    
    # Search book
    resp_search = client.get("/books/search?q=Python")
    assert resp_search.status_code == 200
    assert len(resp_search.json()) >= 1

def test_borrow_and_return():
    # Mượn sách
    borrow_url = f"/borrow/?reader_id=SV001&book_copy_id=CP001&librarian_id=1"
    resp_borrow = client.post(borrow_url)
    assert resp_borrow.status_code == 200
    borrow_id = resp_borrow.json()["borrow_id"]
    
    # Báo cáo sinh viên chưa trả sách
    resp_report = client.get("/reports/unreturned-readers")
    assert resp_report.status_code == 200
    assert len(resp_report.json()) >= 1
    
    # Trả sách
    resp_return = client.post(f"/return/{borrow_id}")
    assert resp_return.status_code == 200
    
    # Top borrow (Reports)
    resp_top = client.get("/reports/top-books?limit=10")
    assert resp_top.status_code == 200

def test_librarian_admin_ops():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create librarian
    librarian_data = {
        "username": "lib1",
        "password": "pwd",
        "full_name": "Librarian 1",
        "role": "librarian"
    }
    resp_create = client.post("/librarians/", json=librarian_data, headers=headers)
    assert resp_create.status_code == 200
    lib_id = resp_create.json()["id"]
    
    # Delete librarian (Requires another admin to take over data or something)
    # The API is /librarians/{librarian_id}?target_librarian_id=x
    # We will just verify the GET API
    resp_get = client.get("/librarians/", headers=headers)
    assert resp_get.status_code == 200
