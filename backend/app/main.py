import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import customers, invoices
from app.db_init import create_db

app = FastAPI(title="ZuperBill API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])

# Only run create_db on actual Uvicorn worker process
@app.on_event("startup")
def startup():
    if os.getenv("RUN_MAIN") == "true":
        print("✅ Running create_db() on startup")
        create_db()
    else:
        print("⏭️ Skipping create_db() in reload supervisor process")
