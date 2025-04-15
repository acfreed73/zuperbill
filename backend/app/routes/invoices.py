# backend/app/routes/invoices.py
from datetime import datetime, date, timedelta
import random
import uuid
from typing import Optional
from app.utils.auth import verify_token
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from fastapi.responses import StreamingResponse
from app.pdf import generate_invoice_pdf_from_html
from app.utils.email import send_invoice_email
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import models
from schemas.invoices import InvoiceCreate, InvoiceOut,  InvoiceUpdate
from app.utils.email import send_email

from app.database import get_db

import io
router = APIRouter()

@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
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
        testimonial=invoice.testimonial,
        tech_id=invoice.tech_id
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
from fastapi import Query
from sqlalchemy import desc, asc
from datetime import datetime, date

@router.get("/", response_model=list[InvoiceOut])
def list_invoices(
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    tech_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    period: Optional[str] = Query(None),  # "ytd" or "all"
    sort_by: str = Query("date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    query = db.query(models.Invoice)

    # Filter by status, customer, tech
    if status:
        query = query.filter(models.Invoice.status == status)

    if customer_id:
        query = query.filter(models.Invoice.customer_id == customer_id)

    if tech_id:
        query = query.filter(models.Invoice.tech_id == tech_id)

    # Apply period filter (YTD or custom)
    if period == "ytd":
        ytd_start = date(datetime.now().year, 1, 1)
        query = query.filter(models.Invoice.date >= ytd_start)

    if date_from:
        query = query.filter(models.Invoice.date >= date_from)
    if date_to:
        query = query.filter(models.Invoice.date <= date_to)

    # Sorting logic
    sort_column = getattr(models.Invoice, sort_by, models.Invoice.date)
    if sort_dir == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Load + map results
    invoices = query.offset(offset).limit(limit).all()
    results = []

    for inv in invoices:
        inv_out = InvoiceOut.from_orm(inv)
        if inv.tech:
            inv_out.user_name = inv.tech.user_name or inv.tech.email
        results.append(inv_out)

    return results

# @router.get("/", response_model=list[InvoiceOut])
# def list_invoices(
#     status: Optional[str] = Query(None),
#     customer_id: Optional[int] = Query(None),
#     limit: int = Query(20, ge=1, le=100),
#     offset: int = Query(0, ge=0),
#     db: Session = Depends(get_db), token: dict = Depends(verify_token)
# ):
#     query = db.query(models.Invoice)

#     if status:
#         query = query.filter(models.Invoice.status == status)

#     if customer_id:
#         query = query.filter(models.Invoice.customer_id == customer_id)
    
#     # invoices = query.offset(offset).limit(limit).all()
#     results = []

#     for inv in query:
#         inv_out = InvoiceOut.from_orm(inv)
#         if inv.tech:
#             inv_out.user_name = inv.tech.user_name or inv.tech.email
#         results.append(inv_out)

#     return results
    # return [InvoiceOut.from_orm(inv) for inv in query.offset(offset).limit(limit).all()]

@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice_out = InvoiceOut.from_orm(invoice)
    
    # Attach tech_name if available
    if invoice.tech:
        invoice_out.user_name = invoice.tech.user_name or invoice.tech.email

    return invoice_out


@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, invoice_update: InvoiceUpdate, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
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
def replace_invoice(invoice_id: int, updated_invoice: InvoiceCreate, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
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
    invoice.tech_id = updated_invoice.tech_id
    invoice.media_folder_url = updated_invoice.media_folder_url

    # Recalculate totals
    subtotal = sum(item.quantity * item.unit_price for item in updated_invoice.items)
    invoice.total = subtotal
    invoice.final_total = round((subtotal - invoice.discount) * (1 + invoice.tax / 100), 2)

    # Handle paid_at logic
    if invoice.status == "paid" and not invoice.paid_at:
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
def generate_invoice_token(invoice_id: int, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    uuid_token = str(uuid.uuid4())

    expiry = datetime.utcnow() + timedelta(days=3)

    invoice.uuid_token = uuid_token
    invoice.token_expiry = expiry

    db.commit()
    return {
        "token": token,
        "expires": expiry,
        "url": f"https://invoice.zuperhandy.com/public/invoice/{token}"
    }

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return None
@router.post("/{invoice_id}/resend", status_code=200)
def resend_invoice(invoice_id: int, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
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
