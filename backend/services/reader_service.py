from sqlalchemy.orm import Session
from fastapi import HTTPException
import models
import schemas

def create_reader(db: Session, reader: schemas.ReaderCreate):
    db_reader = db.query(models.Reader).filter(models.Reader.id == reader.id).first()
    if db_reader:
        raise HTTPException(status_code=400, detail="Mã Độc giả đã tồn tại!")
    new_reader = models.Reader(**reader.dict())
    db.add(new_reader)
    db.commit()
    db.refresh(new_reader)
    return new_reader

def get_all_readers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Reader).offset(skip).limit(limit).all()
