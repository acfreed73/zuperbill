from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from schemas.invoices import InvoiceOut
from datetime import datetime
from typing import Optional

router = APIRouter()


def verify_public_token(token: str, db: Session) -> Optional[int]:
    record = db.query(models.PublicToken).filter(models.PublicToken.token == token).first()
    if not record:
        return None
    if record.expires_at and record.expires_at < datetime.utcnow():
        return None
    return record.invoice_id


@router.get("/public/invoice/{token}", response_model=InvoiceOut)
def view_invoice_by_token(token: str, db: Session = Depends(get_db)):
    invoice_id = verify_public_token(token, db)
    if not invoice_id:
        raise HTTPException(status_code=404, detail="Invalid or expired token")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice
