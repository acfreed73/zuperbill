from app.utils.auth import verify_token
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from schemas.invoices import InvoiceOut, InvoiceAcknowledgment
from app.pdf import generate_invoice_pdf_from_html
from app.utils.email import send_invoice_email
from app.utils.tokens import get_or_create_public_token
import io
import os
from datetime import datetime

BASE_PUBLIC_URL = os.getenv("PUBLIC_FRONTEND_URL", "https://192.168.1.187:3000")

router = APIRouter()

@router.post("/invoices/{invoice_id}/acknowledge", response_model=InvoiceOut)
def acknowledge_invoice(
    invoice_id: int,
    ack: InvoiceAcknowledgment,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if ack.signature_base64:
        invoice.signature_base64 = ack.signature_base64

    invoice.accepted = ack.accepted or False

    if ack.status == "paid" and not invoice.paid_at:
        invoice.paid_at = datetime.utcnow()
    elif ack.status != "paid":
        invoice.paid_at = None

    invoice.testimonial = ack.testimonial
    invoice.status = ack.status or invoice.status
    invoice.payment_type = ack.payment_type or invoice.payment_type
    invoice.notes = ack.notes or invoice.notes

    db.commit()
    db.refresh(invoice)

    return invoice
@router.post("/invoices/{invoice_id}/email", response_model=InvoiceOut)
def email_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.accepted or not invoice.signature_base64 or not invoice.signed_at:
        raise HTTPException(status_code=400, detail="Invoice not fully acknowledged yet")

    public_token = get_or_create_public_token(invoice.id, db, expires_in_hours=None)
    public_url = f"{BASE_PUBLIC_URL}/public/invoice/{public_token}"

    invoice_data = InvoiceOut.from_orm(invoice).dict()
    pdf_bytes = generate_invoice_pdf_from_html(
        invoice_data,
        signature_base64=invoice.signature_base64,
        signed_at=invoice.signed_at.strftime("%m/%d/%Y %H:%M"),
        accepted=invoice.accepted
    )

    body = f"""
    Invoice #{invoice.invoice_number} has been signed and accepted on {invoice.signed_at.strftime('%m/%d/%Y')}.

    You can view or download your invoice anytime at:
    {public_url}

    This is your copy for your records.
    """

    send_invoice_email(
        to_email=invoice.customer.email,
        subject=f"Invoice #{invoice.invoice_number} - Signed",
        body=body,
        attachment=io.BytesIO(pdf_bytes),
        filename=f"invoice_{invoice.invoice_number}_signed.pdf"
    )

    return invoice