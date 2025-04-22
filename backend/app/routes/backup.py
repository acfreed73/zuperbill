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
                customer_id=mapped_customer_id,
                number=inv["number"],
                date=inv.get("date"),
                due_date=inv.get("due_date"),
                status=inv.get("status", "unpaid"),
                notes=inv.get("notes"),
                tax=inv.get("tax") or 0.0,
                discount=inv.get("discount") or 0.0,
                total=inv.get("total") or 0.0,
                final_total=inv.get("final_total") or 0.0,
                payment_type=inv.get("payment_type"),
                paid_at=inv.get("paid_at"),
                signed_at=inv.get("signed_at"),
                accepted=inv.get("accepted", False),
                signature_base64=inv.get("signature_base64"),
                testimonial=inv.get("testimonial"),
                is_active=inv.get("is_active", True),
                uuid_token=inv.get("uuid_token"),
                token_expiry=inv.get("token_expiry"),
                tech_id=inv.get("tech_id"),
                media_folder_url=inv.get("media_folder_url"),
                otp_code=inv.get("otp_code"),
                otp_expiry=inv.get("otp_expiry")
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
