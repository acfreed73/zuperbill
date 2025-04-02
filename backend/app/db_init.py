import time
from sqlalchemy.exc import OperationalError
from app.database import engine, Base
from app.models import Customer, Invoice, LineItem

def create_db():
    retries = 10
    delay = 2  # seconds

    for attempt in range(retries):
        try:
            print("🔄 Trying to connect to the database...")
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created.")
            return
        except OperationalError as e:
            print(f"⏳ Database not ready (attempt {attempt + 1}/{retries})")
            time.sleep(delay)

    raise Exception("❌ Failed to connect to the database after multiple attempts.")
