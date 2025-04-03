from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Shared
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None
class LineItemCreate(BaseModel):
    description: str
    quantity: int
    unit_price: float
class InvoiceBase(BaseModel):
    customer_id: int
    total: Optional[float] = None 
    status: Optional[str] = "unpaid"
    payment_type: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

    discount: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    payment_type: Optional[str] = None
    items: List[LineItemCreate]
    testimonial: Optional[str] = None

# Create
class CustomerCreate(CustomerBase):
    pass
class LineItemCreate(BaseModel):
    description: str
    quantity: int
    unit_price: float

class LineItemOut(LineItemCreate):
    id: int
    class Config:
        from_attributes = True
class InvoiceCreate(InvoiceBase):
    items: List[LineItemCreate]
    testimonial: Optional[str] = None

# Read/Response
class CustomerOut(CustomerBase):
    id: int
    total_due: Optional[float] = 0.0  # ⬅️ Add this
    class Config:
        from_attributes = True
class CustomerWithUnpaid(CustomerOut):
    total_unpaid: float = 0.0

class InvoiceOut(InvoiceBase):
    id: int
    date: datetime
    customer: CustomerOut
    items: List[LineItemOut]
    invoice_number: str

    final_total: Optional[float] = None
    paid_at: Optional[datetime] = None

    testimonial: Optional[str] = None

    class Config:
        from_attributes = True
class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    payment_type: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

    discount: Optional[float] = None
    tax: Optional[float] = None
    payment_type: Optional[str] = None
    paid_at: Optional[datetime] = None

    testimonial: Optional[str] = None
class InvoiceAcknowledgment(BaseModel):
    signed_at: Optional[datetime]
    accepted: Optional[bool]
    signature_base64: Optional[str]
    testimonial: Optional[str] = None


    class Config:
        from_attributes = True