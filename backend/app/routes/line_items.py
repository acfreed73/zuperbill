# backend/app/routes/line_items.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import LineItem

router = APIRouter()

@router.get("/line-items/descriptions", response_model=List[str])
def get_line_item_descriptions(q: str = Query("", min_length=1), db: Session = Depends(get_db)):
    results = (
        db.query(LineItem.description)
        .filter(LineItem.description.ilike(f"%{q}%"))
        .distinct()
        .limit(10)
        .all()
    )
    return [r.description for r in results]
