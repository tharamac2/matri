from datetime import datetime

from pydantic import BaseModel


class SendNotificationRequest(BaseModel):
    title: str
    message: str
    audience: str = "all"
    member_ids: list[int] | None = None


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    audience: str
    sent_at: datetime
    recipient_count: int


class SendNotificationResponse(BaseModel):
    id: int
    recipient_count: int
    status: str
