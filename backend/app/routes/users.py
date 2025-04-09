from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from schemas.users import UserCreate, UserOut
from app.utils.users import hash_password
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_pw = hash_password(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.is_active == True).all()
    return users