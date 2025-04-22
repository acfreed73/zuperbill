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

    if invoice.is_estimate:
        if ack.estimate_signature_base64:
            invoice.estimate_signature_base64 = ack.estimate_signature_base64
        invoice.estimate_accepted = ack.estimate_accepted or False
        invoice.estimate_signed_at = ack.estimate_signed_at or datetime.utcnow()
    else:
        if ack.signature_base64:
            invoice.signature_base64 = ack.signature_base64
        invoice.accepted = ack.accepted or False
        if ack.signed_at:
            invoice.signed_at = ack.signed_at
        else:
            invoice.signed_at = datetime.utcnow()

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
    print("ack email")
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.is_estimate:
        signature = invoice.estimate_signature_base64
        signed_at = invoice.estimate_signed_at.strftime("%m/%d/%Y %H:%M") if invoice.estimate_signed_at else None
        accepted = invoice.estimate_accepted
        doc_type = "Estimate"
    else:
        signature = invoice.signature_base64
        signed_at = invoice.signed_at.strftime("%m/%d/%Y %H:%M") if invoice.signed_at else None
        accepted = invoice.accepted
        doc_type = "Invoice"

    public_token = get_or_create_public_token(invoice.id, db, expires_in_hours=None)
    public_url = f"{BASE_PUBLIC_URL}/public/invoice/{public_token}"
    invoice_data = InvoiceOut.from_orm(invoice).dict()

    pdf_bytes = generate_invoice_pdf_from_html(
        invoice_data,
        signature_base64=signature,
        signed_at=signed_at,
        accepted=accepted,
    )


    if accepted and signature:
        # ✅ Already signed and accepted
        body = f"""
{doc_type} #{invoice.number} has been signed and accepted on {signed_at} UTC.

You can view or download your {doc_type.lower()} anytime at:
{public_url}

This is your copy for your records.
"""
        subject = f"{doc_type} #{invoice.number} - Signed Copy"
        filename = f"{doc_type.lower()}_{invoice.number}_signed.pdf"
    else:
        # 🚨 Not signed yet - request signature
        body = f"""
You have a new {doc_type.lower()} #{invoice.number} ready for review.

Please review, accept, and sign it here:
{public_url}

Thank you,
ZuperHandy Team
"""
        subject = f"Action Required: {doc_type} #{invoice.number} - Please Accept and Sign"
        filename = f"{doc_type.lower()}_{invoice.number}.pdf"

    send_invoice_email(
        to_email=invoice.customer.email,
        subject=subject,
        body=body,
        attachment=io.BytesIO(pdf_bytes),
        filename=filename,
    )

    return invoice