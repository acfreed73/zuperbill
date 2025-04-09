from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import  date
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zipcode = Column(String, nullable=True)
    referral_source = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    invoices = relationship("Invoice", back_populates="customer")
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    date = Column(Date, default=date.today)
    total = Column(Float)
    discount = Column(Float, nullable=True)
    tax = Column(Float, nullable=True)
    final_total = Column(Float)
    status = Column(String)
    due_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    payment_type = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    invoice_number = Column(String, unique=True, nullable=False)

    signed_at = Column(DateTime, nullable=True)
    accepted = Column(Boolean, default=False)
    signature_base64 = Column(Text, nullable=True)
    testimonial = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    uuid_token = Column(String, unique=True, index=True, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    tech_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    customer = relationship("Customer", back_populates="invoices")
    items = relationship("LineItem", back_populates="invoice")
    public_tokens = relationship("PublicToken", back_populates="invoice", cascade="all, delete-orphan")
    tech = relationship("User", back_populates="invoices")

class InvoiceAccessToken(Base):
    __tablename__ = "invoice_access_tokens"
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)

class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)

    invoice = relationship("Invoice", back_populates="items")
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    user_name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=True)

    invoices = relationship("Invoice", back_populates="tech")
class PublicToken(Base):
    __tablename__ = "public_tokens"
    id = Column(Integer, primary_key=True)
    token = Column(String, unique=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime)

    invoice = relationship("Invoice", back_populates="public_tokens")