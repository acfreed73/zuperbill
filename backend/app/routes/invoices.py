# backend/app/routes/invoices.py
from datetime import datetime, date, timedelta
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from app.pdf import generate_invoice_pdf_from_html
from app.utils.email import send_invoice_email
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import models
from schemas.invoices import InvoiceCreate, InvoiceOut,  InvoiceUpdate

from app.database import get_db

import io
router = APIRouter()

@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == invoice.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Calculate subtotal
    subtotal = sum(item.quantity * item.unit_price for item in invoice.items)
    discount = invoice.discount or 0.0
    tax = invoice.tax or 0.0
    final_total = (subtotal - discount) * (1 + tax / 100)

    # Generate invoice number like INV-20250401-001
    today = date.today()
    today_str = today.strftime("%Y%m%d")

    daily_count = db.query(func.count(models.Invoice.id)).filter(
        func.date(models.Invoice.date) == today
    ).scalar() or 0

    invoice_number = f"INV-{today_str}-{str(daily_count + 1).zfill(3)}"

    db_invoice = models.Invoice(
        customer_id=invoice.customer_id,
        total=subtotal,
        discount=discount,
        tax=tax,
        final_total=round(final_total, 2),
        status=invoice.status,
        due_date=invoice.due_date,
        notes=invoice.notes,
        payment_type=invoice.payment_type,
        date=today,
        invoice_number=invoice_number,  # Make sure your model and schema support this field
        testimonial=invoice.testimonial
    )
    print(f"Invoice: {db_invoice}")

    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    for item in invoice.items:
        db_item = models.LineItem(invoice_id=db_invoice.id, **item.dict())
        db.add(db_item)

    db.commit()
    db.refresh(db_invoice)
    return db_invoice
@router.get("/", response_model=list[InvoiceOut])
def list_invoices(
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(models.Invoice)

    if status:
        query = query.filter(models.Invoice.status == status)

    if customer_id:
        query = query.filter(models.Invoice.customer_id == customer_id)

    return [InvoiceOut.from_orm(inv) for inv in query.offset(offset).limit(limit).all()]

@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return InvoiceOut.from_orm(invoice)

@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, invoice_update: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    print(f"invoice: {invoice}")
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    updates = invoice_update.dict(exclude_unset=True)
    
    # Auto-set paid_at if status changed to "paid"
    if "status" in updates and updates["status"] == "paid" and invoice.paid_at is None:
        invoice.paid_at = datetime.utcnow()

    if "status" in updates and updates["status"] != "paid":
        invoice.paid_at = None

    for field, value in updates.items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)
    return invoice
@router.put("/{invoice_id}", response_model=InvoiceOut)
def replace_invoice(invoice_id: int, updated_invoice: InvoiceCreate, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    print(f"Invoice: {invoice}")
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Update basic fields
    invoice.customer_id = updated_invoice.customer_id
    invoice.status = updated_invoice.status or "unpaid"
    invoice.due_date = updated_invoice.due_date
    invoice.notes = updated_invoice.notes
    invoice.payment_type = updated_invoice.payment_type
    invoice.discount = updated_invoice.discount or 0.0
    invoice.tax = updated_invoice.tax or 0.0
    invoice.testimonial = updated_invoice.testimonial

    # Recalculate totals
    subtotal = sum(item.quantity * item.unit_price for item in updated_invoice.items)
    invoice.total = subtotal
    invoice.final_total = round((subtotal - invoice.discount) * (1 + invoice.tax / 100), 2)

    # Handle paid_at logic
    if invoice.status == "paid" and not invoice.paid_at:
        from datetime import datetime
        invoice.paid_at = datetime.utcnow()
    elif invoice.status != "paid":
        invoice.paid_at = None

    # Replace all line items
    db.query(models.LineItem).filter(models.LineItem.invoice_id == invoice_id).delete()
    for item in updated_invoice.items:
        db_item = models.LineItem(invoice_id=invoice_id, **item.dict())
        db.add(db_item)

    db.commit()
    db.refresh(invoice)
    return invoice

@router.post("/{invoice_id}/generate-token")
def generate_invoice_token(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    token = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(days=3)

    invoice.uuid_token = token
    invoice.token_expiry = expiry

    db.commit()
    return {
        "token": token,
        "expires": expiry,
        "url": f"https://invoice.zuperhandy.com/public/invoice/{token}"
    }

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return None
@router.post("/{invoice_id}/resend", status_code=200)
def resend_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_data = InvoiceOut.from_orm(invoice).dict()

    pdf_bytes = generate_invoice_pdf_from_html(
        invoice_data,
        signature_base64=invoice.signature_base64 or "",
        signed_at=invoice.signed_at.strftime("%m/%d/%Y %H:%M") if invoice.signed_at else "",
        accepted=invoice.accepted
    )

    send_invoice_email(
        to_email=invoice.customer.email,
        subject=f"Invoice #{invoice.invoice_number}",
        body=f"Here is your invoice #{invoice.invoice_number} for your records.",
        attachment=io.BytesIO(pdf_bytes),
        filename=f"invoice_{invoice.invoice_number}.pdf"
    )

    return {"message": "Invoice resent successfully"}