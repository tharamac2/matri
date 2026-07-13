from datetime import datetime

from pydantic import BaseModel, EmailStr


class PhotoQueueItem(BaseModel):
    member_id: int
    member_name: str
    member_email: EmailStr
    photo_url: str | None = None
    photo_status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class PhotoStatusUpdateRequest(BaseModel):
    status: str
    note: str | None = None


class IdDocumentQueueItem(BaseModel):
    member_id: int
    member_name: str
    member_email: EmailStr
    id_document_url: str | None = None
    id_verification_status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class IdDocumentStatusUpdateRequest(BaseModel):
    status: str
    note: str | None = None
