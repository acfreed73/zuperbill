from pydantic import BaseModel, EmailStr
from typing import Optional

class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = ""
    street: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    zipcode: Optional[str] = ""
    referral_source: Optional[str] = ""

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    total_unpaid: float = 0.0
    class Config:
        from_attributes = True