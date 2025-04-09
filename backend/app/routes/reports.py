from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, date
from app import models
from app.database import get_db

router = APIRouter()

@router.get("/tech-summary")
def tech_summary(db: Session = Depends(get_db)):
    current_year = datetime.now().year
    ytd_start = date(current_year, 1, 1)

    # Build aggregation per tech
    q = (
        db.query(
            models.User.id.label("tech_id"),
            models.User.user_name,
            models.User.email,

            # YTD counts and totals
            func.count(
                case((models.Invoice.date >= ytd_start, 1))
            ).label("ytd_count"),

            func.coalesce(
                func.sum(case((models.Invoice.date >= ytd_start, models.Invoice.final_total))), 0
            ).label("ytd_total"),

            func.coalesce(
                func.sum(
                    case(
                        ((models.Invoice.date >= ytd_start) & (models.Invoice.status == "paid"), models.Invoice.final_total)
                    )
                ), 0
            ).label("ytd_paid"),

            func.coalesce(
                func.sum(
                    case(
                        ((models.Invoice.date >= ytd_start) & (models.Invoice.status == "unpaid"), models.Invoice.final_total)
                    )
                ), 0
            ).label("ytd_unpaid"),

            func.coalesce(
                func.sum(
                    case(
                        ((models.Invoice.date >= ytd_start) & (models.Invoice.status == "overdue"), models.Invoice.final_total)
                    )
                ), 0
            ).label("ytd_overdue"),

            # All-time
            func.count(models.Invoice.id).label("all_count"),
            func.coalesce(func.sum(models.Invoice.final_total), 0).label("all_total"),
        )
        .outerjoin(models.Invoice, models.User.id == models.Invoice.tech_id)
        .group_by(models.User.id)
        .order_by(models.User.user_name)
        .all()
    )

    # Format output for frontend
    results = []
    for row in q:
        results.append({
            "tech_id": row.tech_id,
            "user_name": row.user_name or row.email,
            "ytd": {
                "invoice_count": row.ytd_count,
                "total_amount": float(row.ytd_total),
                "paid_amount": float(row.ytd_paid),
                "unpaid_amount": float(row.ytd_unpaid),
                "overdue_amount": float(row.ytd_overdue),
            },
            "all_time": {
                "invoice_count": row.all_count,
                "total_amount": float(row.all_total),
            }
        })

    return results
