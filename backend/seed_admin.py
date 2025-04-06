from database import SessionLocal
from models import User
from utils.auth import hash_password

db = SessionLocal()
if not db.query(User).filter(User.email == "admin@zuperhandy.com").first():
    db.add(User(email="admin@zuperhandy.com", hashed_password=hash_password("secureadminpassword")))
    db.commit()
    print("Admin user created.")
else:
    print("Admin already exists.")
db.close()
