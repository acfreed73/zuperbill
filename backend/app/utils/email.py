import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))  # Default to 465 for SSL
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_BACKUP = os.getenv("SMTP_BACKUP")

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