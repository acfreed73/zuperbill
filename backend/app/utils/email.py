import io
import os
import smtplib
from email.message import EmailMessage
from app.pdf import generate_invoice_pdf_from_html
from app import models
from schemas.invoices import InvoiceOut
from dotenv import load_dotenv
from app.database import SessionLocal

    
# Load environment variables
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))  # Default to 465 for SSL
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_BACKUP = os.getenv("SMTP_BACKUP")

BASE_PUBLIC_URL = os.getenv("PUBLIC_FRONTEND_URL", "https://192.168.1.187:3000")
def send_invoice_email(to_email: str, subject: str, body: str, attachment: bytes, filename: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Bcc"] = SMTP_BACKUP

    msg.set_content(body)

    msg.add_attachment(
        attachment.read(),  # read from BytesIO object
        maintype="application",
        subtype="pdf",
        filename=filename
    )

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
            print(f"✅ Sent email to {to_email}, bcc {SMTP_BACKUP}")
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        raise
def send_email(to: str, subject: str, body: str):
    FROM_EMAIL = os.getenv("FROM_EMAIL", "billing@zuperhandy.com")

    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
            print(f"✅ Sent email to {to}, ")
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        raise

def send_public_invoice_email(invoice: "models.Invoice"):
    doc_type = "Estimate" if invoice.is_estimate else "Invoice"
    db = SessionLocal()

    invoice_data = InvoiceOut.from_orm(invoice).dict()
    
    public_token = db.query(models.PublicToken).filter(models.PublicToken.invoice_id == invoice.id).first()
    if not public_token:
        raise Exception("Public token not found for invoice")

    public_link = f"{BASE_PUBLIC_URL}/public/invoice/{public_token.token}"

    if invoice.is_estimate:
        signature_base64 = invoice.estimate_signature_base64
        signed_at = invoice.estimate_signed_at.strftime("%m/%d/%Y %H:%M") if invoice.estimate_signed_at else ""
        accepted = invoice.estimate_accepted
    else:
        signature_base64 = invoice.signature_base64
        signed_at = invoice.signed_at.strftime("%m/%d/%Y %H:%M") if invoice.signed_at else ""
        accepted = invoice.accepted

    pdf_bytes = generate_invoice_pdf_from_html(
        invoice_data,
        signature_base64=signature_base64,
        signed_at=signed_at,
        accepted=accepted,
        doc_type=doc_type,
    )

    send_invoice_email(
        to_email=invoice.customer.email,
        subject=f"{doc_type} #{invoice.number} - Signed Copy",
        body=f"Thank you for signing your {doc_type.lower()}! Attached is your signed copy.\n\nView it anytime at {public_link}",
        attachment=io.BytesIO(pdf_bytes),
        filename=f"{doc_type.lower()}_{invoice.number}_signed.pdf",
    )