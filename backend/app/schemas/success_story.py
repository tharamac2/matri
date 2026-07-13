from datetime import date, datetime

from pydantic import BaseModel


class SuccessStoryCreateRequest(BaseModel):
    member_a_id: int | None = None
    member_b_id: int | None = None
    title: str
    story: str
    photo_url: str | None = None
    wedding_date: date | None = None
    is_published: bool = False


class SuccessStoryUpdateRequest(BaseModel):
    member_a_id: int | None = None
    member_b_id: int | None = None
    title: str | None = None
    story: str | None = None
    photo_url: str | None = None
    wedding_date: date | None = None
    is_published: bool | None = None


class SuccessStoryAdminOut(BaseModel):
    id: int
    member_a_id: int | None = None
    member_b_id: int | None = None
    title: str
    story: str
    photo_url: str | None = None
    wedding_date: date | None = None
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}
