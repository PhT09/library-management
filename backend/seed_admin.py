
"""
Chạy file này để tạo tài khoản admin duy nhất cho hệ thống
"""

from db.session import SessionLocal
from models.user import User
from core.security import get_password_hash

def seed_admin():
    # Tạo session kết nối với database
    db = SessionLocal()
    
    # Kiểm tra xem tài khoản admin đã tồn tại chưa
    admin = db.query(User).filter(User.username == "admin@admin.com").first()
    
    if not admin:
        # Nếu chưa có, tạo tài khoản admin mới
        new_admin = User(
            username="admin@admin.com",
            full_name="System Administrator",
            hashed_password=get_password_hash("AdminLibMng@123"),
            role="admin",
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print("Khởi tạo thành công tài khoản Admin:")
        print("   - Username: admin@admin.com")
        print("   - Password: AdminLibMng@123")
    else:
        print("Tài khoản admin đã tồn tại. Username: admin@admin.com")
        
    db.close()

if __name__ == "__main__":
    seed_admin()
