from datetime import date

from pydantic import BaseModel


class PlanCreateRequest(BaseModel):
    name: str
    price: float
    duration_days: int
    features: dict | None = None
    is_active: bool = True


class PlanUpdateRequest(BaseModel):
    name: str | None = None
    price: float | None = None
    duration_days: int | None = None
    features: dict | None = None
    is_active: bool | None = None


class PlanResponse(BaseModel):
    id: int
    name: str
    price: float
    duration_days: int
    features: dict | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class SubscriptionResponse(BaseModel):
    id: int
    member_id: int
    plan_id: int
    start_date: date
    end_date: date
    status: str
    auto_renew: bool

    model_config = {"from_attributes": True}
