import time
from app.models import User
from app.database import SessionLocal
from passlib.hash import bcrypt
from sqlalchemy.exc import OperationalError
from app.database import engine, Base

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

def seed_admin():
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "admin@zuperhandy.com").first()
    if not existing:
        print("🌱 Seeding admin user...")
        admin = User(
            email="admin@zuperhandy.com",
            hashed_password=bcrypt.hash("adminpass"),
            is_active=True,
            is_admin=True
        )
        db.add(admin)
        db.commit()
    else:
        print("ℹ️ Admin user already exists")
    db.close()