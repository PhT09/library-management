from sqlalchemy import Column, String, Date, Boolean
from db.session import Base

class Reader(Base):
    __tablename__ = "readers"
    id = Column(String(20), primary_key=True, index=True) # Mã ĐG
    full_name = Column(String(100))
    class_name = Column(String(50))
    dob = Column(Date)
    gender = Column(String(10))
    is_active = Column(Boolean, default=True)
