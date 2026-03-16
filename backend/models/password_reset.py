from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from db.session import Base

class PasswordResetTicket(Base):
    __tablename__ = "password_reset_tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String(500))
    status = Column(String(20), default="pending")  # pending, processed, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
