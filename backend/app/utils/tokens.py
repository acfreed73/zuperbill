from datetime import datetime, timedelta
import uuid
from app import models
from sqlalchemy.orm import Session
from app.models import PublicToken

def generate_public_token(invoice_id: int, db: Session, expires_in_hours: int | None = 72) -> str:
    token = str(uuid.uuid4())

    # If expires_in_hours is None, we don't set an expiration
    expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours) if expires_in_hours is not None else None

    public_token = PublicToken(
        token=token,
        invoice_id=invoice_id,
        expires_at=expires_at
    )

    db.add(public_token)
    db.commit()
    db.refresh(public_token)

    return token
def get_or_create_public_token(invoice_id: int, db: Session, expires_in_hours: int | None = 72) -> str:
    existing = db.query(PublicToken).filter(PublicToken.invoice_id == invoice_id).first()
    if existing:
        return existing.token

    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours) if expires_in_hours is not None else None

    new_token = PublicToken(
        token=token,
        invoice_id=invoice_id,
        expires_at=expires_at
    )

    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return new_token.token
