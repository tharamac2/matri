from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_plan import SubscriptionPlan
from app.schemas.common import PaginatedResponse
from app.schemas.subscription import PlanCreateRequest, PlanResponse, PlanUpdateRequest, SubscriptionResponse

router = APIRouter()


@router.get("/plans", response_model=list[PlanResponse], dependencies=[Depends(require_role("moderator", "viewer"))])
def list_plans(db: Session = Depends(get_db), active_only: bool = Query(False)):
    query = db.query(SubscriptionPlan)
    if active_only:
        query = query.filter(SubscriptionPlan.is_active.is_(True))
    return query.order_by(SubscriptionPlan.price).all()


@router.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role())])
def create_plan(payload: PlanCreateRequest, db: Session = Depends(get_db)):
    plan = SubscriptionPlan(
        name=payload.name,
        price=payload.price,
        duration_days=payload.duration_days,
        features=payload.features,
        is_active=payload.is_active,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/plans/{plan_id}", response_model=PlanResponse, dependencies=[Depends(require_role())])
def update_plan(plan_id: int, payload: PlanUpdateRequest, db: Session = Depends(get_db)):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/", response_model=PaginatedResponse[SubscriptionResponse], dependencies=[Depends(require_role("moderator", "viewer"))])
def list_subscriptions(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    plan_id: int | None = Query(None),
):
    query = db.query(Subscription)
    if status_filter:
        query = query.filter(Subscription.status == status_filter)
    if plan_id:
        query = query.filter(Subscription.plan_id == plan_id)

    total = query.count()
    items = (
        query.order_by(Subscription.start_date.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.put("/{subscription_id}/cancel", response_model=SubscriptionResponse, dependencies=[Depends(require_role("moderator"))])
def cancel_subscription(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if subscription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    subscription.status = SubscriptionStatus.cancelled
    subscription.auto_renew = False
    if subscription.end_date > date.today():
        subscription.end_date = date.today()

    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription
