from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class AdminUpdateRequest(BaseModel):
    name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class AdminResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: int
    admin_id: int | None = None
    action: str
    resource_type: str
    resource_id: int | None = None
    old_value: dict | None = None
    new_value: dict | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
