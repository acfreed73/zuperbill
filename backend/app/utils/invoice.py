# backend/app/utils/invoice.py
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models

def generate_invoice_number(db: Session) -> str:
    today = date.today()
    today_str = today.strftime("%Y%m%d")
    prefix = f"INV-{today_str}-"

    existing_numbers = db.query(models.Invoice.number).filter(
        models.Invoice.number.like(f"{prefix}%")
    ).all()

    existing_seqs = []
    for (number,) in existing_numbers:
        try:
            seq = int(number.split("-")[-1])
            existing_seqs.append(seq)
        except:
            continue

    next_seq = max(existing_seqs, default=0) + 1
    invoice_number = f"{prefix}{str(next_seq).zfill(3)}"
    return invoice_number

def generate_estimate_number(db: Session) -> str:
    today = date.today()
    today_str = today.strftime("%Y%m%d")
    prefix = f"EST-{today_str}-"

    existing_numbers = db.query(models.Invoice.number).filter(
        models.Invoice.number.like(f"{prefix}%")
    ).all()

    existing_seqs = []
    for (number,) in existing_numbers:
        try:
            seq = int(number.split("-")[-1])
            existing_seqs.append(seq)
        except:
            continue

    next_seq = max(existing_seqs, default=0) + 1
    estimate_number = f"{prefix}{str(next_seq).zfill(3)}"
    return estimate_number
