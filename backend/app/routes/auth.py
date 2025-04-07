# app/routesauth.py
import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from passlib.hash import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from schemas.users import UserCreate, UserLogin
from app.utils.auth import SECRET_KEY, ALGORITHM, create_access_token, verify_password
from app.database import get_db


ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

router = APIRouter()

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_pw = bcrypt.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    return {"message": "User registered"}

@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not bcrypt.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {
        "sub": user.email,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
