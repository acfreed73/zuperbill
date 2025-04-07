# app/utils/auth.py
from jose import JWTError, jwt
from datetime import datetime, timedelta
import bcrypt
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from starlette.status import HTTP_401_UNAUTHORIZED
from app.database import get_db
from app import models
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

auth_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.verify(password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def verify_token(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPBearer = Depends(auth_scheme)
):
    if request.method == "OPTIONS":
        return None

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")

        return user
    except JWTError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token")
