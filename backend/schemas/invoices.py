# backend/schemas/invoices.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .customers import CustomerOut

class LineItemBase(BaseModel):
    description: str
    quantity: int
    unit_price: float

class LineItemCreate(BaseModel):
    description: str
    quantity: int
    unit_price: float

class LineItemOut(LineItemBase):
    id: int

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    status: Optional[str] = "unpaid"
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    payment_type: Optional[str] = None
    discount: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    testimonial: Optional[str] = None
    tech_id: Optional[int] = None

class InvoiceCreate(InvoiceBase):
    customer_id: int
    items: List[LineItemCreate]
    media_folder_url: Optional[str] = None
    is_estimate: Optional[bool] = False
    is_active: Optional[bool] = True


class InvoiceUpdate(InvoiceBase):
    customer_id: int
    due_date: datetime
    status: str
    notes: Optional[str]
    payment_type: Optional[str]
    discount: Optional[float]
    tax: Optional[float]
    tech_id: Optional[int]
    is_active: bool
    items: List[LineItemCreate]

class InvoiceOut(InvoiceBase):
    id: int
    customer_id: int
    number: str
    date: Optional[datetime]
    due_date: Optional[datetime]
    signed_at: Optional[datetime]
    accepted: Optional[bool]                # <-- Add this
    signature_base64: Optional[str] = None  # <-- Add this
    uuid_token: Optional[str] = None        # <-- Add this
    token_expiry: Optional[datetime] = None # <-- Add this
    paid_at: Optional[datetime] = None
    testimonial: Optional[str] = None
    customer: CustomerOut
    items: List[LineItemOut]
    total: Optional[float] = 0.0
    final_total: Optional[float] = 0.0

    tech_id: Optional[int]
    user_name: Optional[str] = None
    media_folder_url: Optional[str]
    is_active: bool

    is_estimate: bool
    estimate_accepted: Optional[bool] = None
    estimate_signed_at: Optional[datetime] = None
    estimate_signature_base64: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceAcknowledgment(BaseModel):
    signed_at: Optional[datetime] = None
    accepted: Optional[bool] = None
    signature_base64: Optional[str] = None
    testimonial: Optional[str] = None
    status: Optional[str] = None
    payment_type: Optional[str] = None
    notes: Optional[str] = None

    estimate_accepted: Optional[bool] = None
    estimate_signed_at: Optional[datetime] = None
    estimate_signature_base64: Optional[str] = None

    class Config:
        from_attributes = True

class OtpVerifyRequest(BaseModel):
    pin: str
