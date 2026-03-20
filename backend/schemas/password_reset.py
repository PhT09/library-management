from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ForgotPasswordRequest(BaseModel):
    identifier: str  # username or full_name
    reason: Optional[str] = "Forgot password"

class ResetTicketResponse(BaseModel):
    id: int
    user_id: int
    reason: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResetTicketProcessRequest(BaseModel):
    action: str  # "process" or "reject"
    new_password: Optional[str] = None
