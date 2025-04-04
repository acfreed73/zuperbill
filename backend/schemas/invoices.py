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

class InvoiceCreate(InvoiceBase):
    customer_id: int
    items: List[LineItemCreate]


class InvoiceUpdate(InvoiceBase):
    items: Optional[List[LineItemCreate]] = []

class InvoiceOut(InvoiceBase):
    id: int
    customer_id: int
    invoice_number: str
    date: Optional[datetime]
    due_date: Optional[datetime]
    signed_at: Optional[datetime]
    customer: CustomerOut
    items: List[LineItemOut]
    total: float = 0.0
    final_total: float = 0.0

    class Config:
        from_attributes = True
class InvoiceAcknowledgment(BaseModel):
    signed_at: Optional[datetime]
    accepted: Optional[bool]
    signature_base64: Optional[str]
    testimonial: Optional[str] = None


    class Config:
        from_attributes = True