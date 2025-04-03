# backend/app/routes/acknowledgment.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.pdf import generate_invoice_pdf_from_html
from app.utils.email import send_invoice_email
import io
from datetime import datetime

router = APIRouter()

@router.post("/invoices/{invoice_id}/acknowledge", response_model=schemas.InvoiceOut)
def acknowledge_invoice(
    invoice_id: int,
    ack: schemas.InvoiceAcknowledgment,
    db: Session = Depends(get_db)
):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Update invoice with acknowledgment details
    invoice.accepted = ack.accepted or False
    invoice.signed_at = ack.signed_at or datetime.utcnow()
    invoice.signature_base64 = ack.signature_base64
    db.commit()
    db.refresh(invoice)

    # Generate PDF
    invoice_data = schemas.InvoiceOut.from_orm(invoice).dict()
    pdf_bytes = generate_invoice_pdf_from_html(
    invoice_data,
    signature_base64=ack.signature_base64 or "",
    signed_at=invoice.signed_at.strftime("%m/%d/%Y %H:%M"),
    accepted=invoice.accepted
)

    # Send the email to customer and BCC to internal backup
    send_invoice_email(
        to_email=invoice.customer.email,
        subject=f"Invoice #{invoice.invoice_number} - Signed",
        body=f"""
        Invoice #{invoice.invoice_number} has been signed and accepted on {invoice.signed_at.strftime('%m/%d/%Y')}.
        This is your copy for your records.
        """,
        attachment=io.BytesIO(pdf_bytes),
        filename=f"invoice_{invoice.invoice_number}_signed.pdf"
    )

    return invoice
