import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import BackgroundTasks
import threading
import time

from app.routes import (
    customers,
    invoices,
    users,
    acknowledgment,
    testimonials,
    line_items,
    public,
    auth,
)
from app.utils.auth import verify_token
from app.db_init import create_db, seed_admin

load_dotenv()

app = FastAPI(title="ZuperBill API")

origins = [
    "https://192.168.1.187:3000",  # your React dev server
    "https://192.168.1.187:8000",  # your React dev server
    "https://invoice.zuperhandy.com",  # if also serving prod
    "https://api.invoice.zuperhandy.com",  # if also serving prod
]
headers = ["Authorization", "Content-Type"]
# CORS setup (relax as needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific domains for production
    # allow_origins=[origins],  # Use specific domains for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure all non-public routes
@app.middleware("http")
async def secure_routes(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)  # allow preflight

    if request.url.path.startswith("/public/") or request.url.path.startswith("/auth"):
        return await call_next(request)

    auth_header = request.headers.get("authorization")  # lowercase-safe access

    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    token = auth_header.split("Bearer ")[1]
    if not verify_token(token):
        return JSONResponse(status_code=403, content={"detail": "Invalid token"})

    return await call_next(request)

# Routes
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
app.include_router(users.router)
app.include_router(acknowledgment.router)
app.include_router(testimonials.router, prefix="/ai")
app.include_router(line_items.router)
app.include_router(public.router)

# Error handling
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Validation error:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )
def post_startup_seed():
    time.sleep(3)  # wait for full startup
    try:
        seed_admin()
    except Exception as e:
        import logging
        logging.error(f"❌ Post-startup seed_admin failed: {e}")
@app.on_event("startup")
def startup():
    if os.getenv("RUN_MAIN") == "true":
        print("✅ Running create_db() on startup")
        print("🔥🔥🔥 STARTUP HOOK TRIGGERED 🔥🔥🔥")
        create_db()
        seed_admin()
    else:
        print("⏭️ Skipping create_db() in reload supervisor process")
    # Schedule background task AFTER app starts up
    threading.Thread(target=post_startup_seed, daemon=True).start()
