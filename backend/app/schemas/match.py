from datetime import datetime

from pydantic import BaseModel, EmailStr


class MatchMemberSummary(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = {"from_attributes": True}


class MatchResponse(BaseModel):
    id: int
    sender: MatchMemberSummary
    receiver: MatchMemberSummary
    status: str
    sent_at: datetime
    responded_at: datetime | None = None

    model_config = {"from_attributes": True}
