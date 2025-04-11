import random
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from schemas.invoices import InvoiceOut, OtpVerifyRequest
from datetime import datetime
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.utils.email import send_email
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
@router.get("/public/testimonials", response_model=List[dict])
def get_testimonials(db: Session = Depends(get_db)):
    invoices = (
        db.query(models.Invoice)
        .join(models.Customer)
        .filter(models.Invoice.testimonial != None)
        .order_by(models.Invoice.signed_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "testimonial": invoice.testimonial.strip('"'),
            "name": invoice.customer.first_name
        }
        for invoice in invoices if invoice.testimonial
    ]
@router.get("/public/invoice/{uuid}/request-otp")
def request_otp(uuid: str, db: Session = Depends(get_db)):
    print(f"🔍 Incoming UUID token: {uuid}")

    public_token = db.query(models.PublicToken).filter(models.PublicToken.token == uuid).first()

    if not public_token or (public_token.expires_at and public_token.expires_at < datetime.utcnow()):
        raise HTTPException(status_code=404, detail="Invalid or expired token")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == public_token.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.customer or not invoice.customer.email:
        raise HTTPException(status_code=400, detail="No customer email available")

    # ✅ Throttle OTP resends within 90 seconds
    now = datetime.utcnow()
    if invoice.otp_expiry and invoice.otp_expiry > now and invoice.otp_code:
        seconds_remaining = (invoice.otp_expiry - now).total_seconds()
        if seconds_remaining > 30:
            print("⏳ Skipping resend — recent OTP still valid.")
            return JSONResponse(
                status_code=200,
                content={"message": "OTP already sent. Please try again in a couple minutes."}
            )

    # ✅ Generate and save new OTP
    otp = f"{random.randint(100000, 999999)}"
    expiry = now + timedelta(minutes=2)

    invoice.otp_code = otp
    invoice.otp_expiry = expiry
    db.commit()

    print(f"🔐 Generated OTP: {otp} (expires at {expiry.isoformat()})")
    print(f"📧 Sending OTP to customer email: {invoice.customer.email}")

    send_email(
        to=invoice.customer.email,
        subject="Accessing your ZuperHandy invoice",
        body=f"""
        Someone attempted to access your invoice.

        If this was not you, please email billing@zuperhandy.com.

        If it was you, your One-Time PIN is: {otp}
        This PIN will expire in 2 minutes.
        """
    )

    print("📨 OTP email dispatched.")
    return {"message": "OTP sent"}

@router.post("/public/invoice/{uuid}/verify-otp")
def verify_otp(uuid: str, payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    pin = payload.pin

    public_token = db.query(models.PublicToken).filter(models.PublicToken.token == uuid).first()
    if not public_token:
        raise HTTPException(status_code=404, detail="Invalid or expired token")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == public_token.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.otp_code != pin or not invoice.otp_expiry or invoice.otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=403, detail="Invalid or expired OTP")

    return {"verified": True}