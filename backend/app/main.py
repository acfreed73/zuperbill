import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import customers, invoices, acknowledgment, testimonials, line_items
from fastapi.staticfiles import StaticFiles


from app.db_init import create_db

load_dotenv()

app = FastAPI(title="ZuperBill API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
app.include_router(acknowledgment.router)
app.include_router(testimonials.router, prefix="/ai")
app.include_router(line_items.router)


# Only run create_db on actual Uvicorn worker process
@app.on_event("startup")
def startup():
    if os.getenv("RUN_MAIN") == "true":
        print("✅ Running create_db() on startup")
        create_db()
    else:
        print("⏭️ Skipping create_db() in reload supervisor process")
