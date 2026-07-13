from datetime import datetime
from itertools import count

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.member import Member, MemberStatus
from app.schemas.common import PaginatedResponse
from app.schemas.notification import (
    NotificationResponse,
    SendNotificationRequest,
    SendNotificationResponse,
)

router = APIRouter(dependencies=[Depends(require_role("moderator"))])

# No notifications table is defined in the schema; sent notifications are tracked
# in-process so the endpoints have real, queryable behavior during development.
_notification_log: list[NotificationResponse] = []
_id_sequence = count(1)


def _resolve_recipient_count(db: Session, payload: SendNotificationRequest) -> int:
    if payload.audience == "selected":
        if not payload.member_ids:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="member_ids required for selected audience")
        return db.query(Member).filter(Member.id.in_(payload.member_ids)).count()

    query = db.query(Member)
    if payload.audience == "active":
        query = query.filter(Member.status == MemberStatus.active)
    elif payload.audience == "inactive":
        query = query.filter(Member.status == MemberStatus.inactive)
    elif payload.audience != "all":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid audience")

    return query.count()


@router.post("/send", response_model=SendNotificationResponse, status_code=status.HTTP_201_CREATED)
def send_notification(payload: SendNotificationRequest, db: Session = Depends(get_db)):
    recipient_count = _resolve_recipient_count(db, payload)

    notification = NotificationResponse(
        id=next(_id_sequence),
        title=payload.title,
        message=payload.message,
        audience=payload.audience,
        sent_at=datetime.utcnow(),
        recipient_count=recipient_count,
    )
    _notification_log.insert(0, notification)

    return SendNotificationResponse(id=notification.id, recipient_count=recipient_count, status="sent")


@router.get("/", response_model=PaginatedResponse[NotificationResponse])
def list_notifications(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)):
    total = len(_notification_log)
    start = (page - 1) * size
    items = _notification_log[start : start + size]
    return PaginatedResponse(items=items, total=total, page=page, size=size)
