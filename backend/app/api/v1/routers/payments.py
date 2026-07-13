import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.member import Member
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.subscription_plan import SubscriptionPlan
from app.schemas.common import PaginatedResponse
from app.schemas.payment import PaymentResponse

router = APIRouter(dependencies=[Depends(require_role("moderator", "viewer"))])


def _query_with_joins(db: Session):
    return (
        db.query(Payment, Member, SubscriptionPlan)
        .join(Member, Payment.member_id == Member.id)
        .join(Subscription, Payment.subscription_id == Subscription.id)
        .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
    )


@router.get("/", response_model=PaginatedResponse[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
):
    query = _query_with_joins(db)
    if status_filter:
        query = query.filter(Payment.status == status_filter)

    total = query.count()
    rows = query.order_by(Payment.paid_at.desc()).offset((page - 1) * size).limit(size).all()

    items = [
        PaymentResponse(
            id=payment.id,
            member_id=member.id,
            member_name=member.name,
            plan_name=plan.name,
            amount=float(payment.amount),
            gateway=payment.gateway,
            txn_id=payment.txn_id,
            status=payment.status.value,
            paid_at=payment.paid_at,
        )
        for payment, member, plan in rows
    ]
    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.get("/export")
def export_payments(db: Session = Depends(get_db)):
    rows = _query_with_joins(db).order_by(Payment.paid_at.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "member_name", "plan_name", "amount", "gateway", "txn_id", "status", "paid_at"])
    for payment, member, plan in rows:
        writer.writerow([
            payment.id, member.name, plan.name, payment.amount,
            payment.gateway, payment.txn_id, payment.status.value, payment.paid_at.isoformat(),
        ])

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments_export.csv"},
    )
