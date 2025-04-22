# backend/app/routes/backup.py
import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Customer, Invoice, LineItem
import json

router = APIRouter()

# Helper to serialize SQLAlchemy objects
def serialize(obj):
    data = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        if isinstance(value, (datetime.date, datetime.datetime)):
            value = value.isoformat()  # Convert to "YYYY-MM-DD" string
        data[column.name] = value
    return data

# --- DOWNLOAD BACKUP ---
@router.get("/download")
def download_backup():
    print("Downloading backup...")
    db: Session = SessionLocal()
    customers = db.query(Customer).all()
    invoices = db.query(Invoice).all()
    # Only backup valid line items (attached to an invoice)
    line_items = db.query(LineItem).filter(LineItem.invoice_id.isnot(None)).all()

    backup_data = {
        "customers": [serialize(c) for c in customers],
        "invoices": [serialize(i) for i in invoices],
        "line_items": [serialize(l) for l in line_items],
    }

    return JSONResponse(content=backup_data)

# --- UPLOAD BACKUP ---
@router.post("/upload")
async def upload_backup(file: UploadFile = File(...)):
    db: Session = SessionLocal()

    try:
        contents = await file.read()
        data = json.loads(contents)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file format")

    # --- Import customers ---
    customer_map = {}  # old_id -> new_id
    for cust in data.get("customers", []):
        existing = db.query(Customer).filter(Customer.email == cust["email"]).first()
        if existing:
            customer_map[cust["id"]] = existing.id
        else:
            new_cust = Customer(
                first_name=cust["first_name"],
                last_name=cust["last_name"],
                email=cust["email"],
                phone=cust.get("phone", ""),
                street=cust.get("street", ""),
                city=cust.get("city", ""),
                state=cust.get("state", ""),
                zipcode=cust.get("zipcode", ""),
                referral_source=cust.get("referral_source", ""),
                is_active=cust.get("is_active", True)
            )
            db.add(new_cust)
            db.flush()
            customer_map[cust["id"]] = new_cust.id
    db.commit()


    # --- Import invoices ---
    invoice_map = {}  # old_id -> new_id
    for inv in data.get("invoices", []):
        mapped_customer_id = customer_map.get(inv["customer_id"])
        if not mapped_customer_id:
            continue  # skip if no customer

        existing = db.query(Invoice).filter(
            Invoice.number == inv["number"],
            Invoice.customer_id == mapped_customer_id
        ).first()

        if existing:
            invoice_map[inv["id"]] = existing.id
        else:
            new_inv = Invoice(
                accepted=inv.get("accepted", False),
                customer_id=mapped_customer_id,
                date=inv.get("date"),
                discount=inv.get("discount") or 0.0,
                due_date=inv.get("due_date"),
                estimate_accepted=inv.get("estimate_accepted", False),
                estimate_signature_base64=inv.get("estimate_signature_base64"),
                estimate_signed_at=inv.get("estimate_signed_at"),
                final_total=inv.get("final_total") or 0.0,
                is_active=inv.get("is_active", True),
                is_estimate=inv.get("is_estimate", False),
                media_folder_url=inv.get("media_folder_url"),
                notes=inv.get("notes"),
                number=inv["number"],
                otp_code=inv.get("otp_code"),
                otp_expiry=inv.get("otp_expiry"),
                paid_at=inv.get("paid_at"),
                payment_type=inv.get("payment_type"),
                signature_base64=inv.get("signature_base64"),
                signed_at=inv.get("signed_at"),
                status=inv.get("status", "unpaid"),
                tax=inv.get("tax") or 0.0,
                tech_id=inv.get("tech_id"),
                testimonial=inv.get("testimonial"),
                token_expiry=inv.get("token_expiry"),
                total=inv.get("total") or 0.0,
                uuid_token=inv.get("uuid_token"),
            )
            db.add(new_inv)
            db.flush()
            invoice_map[inv["id"]] = new_inv.id
    db.commit()


    # --- Import line items ---
    for li in data.get("line_items", []):
        invoice_id_mapped = invoice_map.get(li["invoice_id"])
        if not invoice_id_mapped:
            continue  # Skip if no valid invoice match

        # Check if the same line item already exists
        existing_lineitem = db.query(LineItem).filter(
            LineItem.invoice_id == invoice_id_mapped,
            LineItem.description == li["description"],
            LineItem.quantity == li["quantity"],
            LineItem.unit_price == li["unit_price"]
        ).first()

        if not existing_lineitem:
            new_li = LineItem(
                invoice_id=invoice_id_mapped,
                description=li["description"],
                quantity=li["quantity"],
                unit_price=li["unit_price"]
            )
            db.add(new_li)

    db.commit()

    print("Backup successfully restored.")

    return {"message": "Backup successfully restored."}
