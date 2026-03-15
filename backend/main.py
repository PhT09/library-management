from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import các file
from db.session import engine
import models
from api.readers import router as readers_router
from api.books import router as books_router
from api.borrow import router as borrow_router
from api.auth import router as auth_router
from api.users import router as users_router
from api.reports import router as reports_router

# Sinh DB
models.Base.metadata.create_all(bind=engine)

# Khởi tạo mặc định tài khoản admin
from seed_admin import seed_admin
seed_admin()

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

app.include_router(readers_router)
app.include_router(books_router)
app.include_router(borrow_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(reports_router)
