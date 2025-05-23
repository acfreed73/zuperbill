from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from schemas.customers import CustomerCreate, CustomerOut
from app.database import get_db
from app.utils.auth import verify_token
router = APIRouter()

@router.post("/", response_model=CustomerOut)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), _: models.User = Depends(verify_token)):
    print(f"token: ")
    existing = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists.")

    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=list[CustomerOut])
def list_customers(
    search: str = Query("", alias="q"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: models.User = Depends(verify_token)

):
    base_query = db.query(models.Customer)

    if search:
        search_filter = f"%{search.lower()}%"
        base_query = base_query.filter(
            func.lower(models.Customer.first_name).like(search_filter) |
            func.lower(models.Customer.last_name).like(search_filter) |
            func.lower(models.Customer.email).like(search_filter) |
            func.lower(models.Customer.phone).like(search_filter)
        )

    customers = base_query.offset(offset).limit(limit).all()

    result = []
    for c in customers:
        unpaid_total = db.query(func.coalesce(func.sum(models.Invoice.final_total), 0)).filter(
            models.Invoice.customer_id == c.id,
            models.Invoice.status != "paid",
            models.Invoice.is_estimate == False,
            models.Invoice.is_active == True
        ).scalar()

        result.append({
            **CustomerOut.from_orm(c).dict(),
            "total_unpaid": unpaid_total
        })

    return result


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), _: models.User = Depends(verify_token) ):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, updated: CustomerCreate, db: Session = Depends(get_db), _: models.User = Depends(verify_token) ):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in updated.dict().items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


# @router.delete("/{customer_id}")
# def delete_customer(customer_id: int, db: Session = Depends(get_db), _: models.User = Depends(verify_token) ):
#     customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
#     if not customer:
#         raise HTTPException(status_code=404, detail="Customer not found")

#     db.delete(customer)
#     db.commit()
#     db.expire_all()
#     return {"detail": "Customer deleted"}
@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), _: models.User = Depends(verify_token)):
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    db.expire_all()  # Optional to clear cache
    return {"detail": f"Customer {customer_id} and related invoices/line-items deleted."}