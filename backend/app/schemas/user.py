from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, EmailStr


class MemberResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    gender: str
    dob: date | None = None
    religion: str | None = None
    caste: str | None = None
    city: str | None = None
    state: str | None = None
    status: str
    created_at: datetime
    last_active: datetime | None = None

    model_config = {"from_attributes": True}


class MemberDetailResponse(MemberResponse):
    bio: str | None = None
    height_cm: int | None = None
    education: str | None = None
    profession: str | None = None
    income_lpa: float | None = None
    photo_url: str | None = None
    photo_status: str | None = None
    partner_prefs: dict[str, Any] | None = None


class UpdateStatusRequest(BaseModel):
    status: str


class BulkActionRequest(BaseModel):
    member_ids: list[int]
    action: str


class BulkActionResponse(BaseModel):
    updated: int
    action: str


class ActivityLogResponse(BaseModel):
    id: int
    action: str
    ip_address: str | None = None
    device: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
