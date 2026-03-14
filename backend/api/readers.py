from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
import schemas
from services import reader_service

router = APIRouter(prefix="/readers", tags=["Quản lý Độc giả"])

@router.post("/", response_model=schemas.ReaderResponse)
def create_reader(reader: schemas.ReaderCreate, db: Session = Depends(get_db)):
    return reader_service.create_reader(db=db, reader=reader)

@router.get("/")
def get_all_readers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return reader_service.get_all_readers(db=db, skip=skip, limit=limit)
@router.put("/{reader_id}", response_model=schemas.ReaderResponse)
def update_reader(reader_id: str, reader_update: schemas.ReaderUpdate, db: Session = Depends(get_db)):
    return reader_service.update_reader(db=db, reader_id=reader_id, reader_update=reader_update)

@router.delete("/{reader_id}")
def delete_reader(reader_id: str, db: Session = Depends(get_db)):
    return reader_service.delete_reader(db=db, reader_id=reader_id)
