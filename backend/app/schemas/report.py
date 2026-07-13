from datetime import datetime

from pydantic import BaseModel


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    reported_id: int
    reason: str
    description: str | None = None
    status: str
    reviewed_by: int | None = None
    created_at: datetime
    resolved_at: datetime | None = None
    resolution_note: str | None = None

    model_config = {"from_attributes": True}


class ReportActionRequest(BaseModel):
    action: str
    note: str | None = None
