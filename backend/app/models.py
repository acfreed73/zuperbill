from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zipcode = Column(String, nullable=True)

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

    customer = relationship("Customer", back_populates="invoices")
    items = relationship("LineItem", back_populates="invoice")



class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)

    invoice = relationship("Invoice", back_populates="items")