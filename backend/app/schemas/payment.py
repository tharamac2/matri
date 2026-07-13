from datetime import datetime

from pydantic import BaseModel


class PaymentResponse(BaseModel):
    id: int
    member_id: int
    member_name: str
    plan_name: str | None = None
    amount: float
    gateway: str
    txn_id: str
    status: str
    paid_at: datetime

    model_config = {"from_attributes": True}
