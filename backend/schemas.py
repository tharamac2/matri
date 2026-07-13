from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    phone_number: str
    password: str
    profile_for: str
    gender: str

class UserLogin(BaseModel):
    phone_number: str
    password: str

class UserResponse(BaseModel):
    id: int
    phone_number: str
    is_active: bool

    class Config:
        from_attributes = True
