from datetime import date, datetime

from pydantic import BaseModel


class MemberRegisterRequest(BaseModel):
    name: str
    phone_number: str
    password: str
    profile_for: str
    gender: str
    dob: date | None = None
    religion: str | None = None
    caste: str | None = None
    city: str | None = None
    state: str | None = None
    education: str | None = None
    profession: str | None = None
    bio: str | None = None
    marital_status: str | None = None
    mother_tongue: str | None = None


class MemberLoginRequest(BaseModel):
    phone_number: str
    password: str


class MemberTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    member_id: int
    name: str


class MemberRefreshRequest(BaseModel):
    refresh_token: str


class MemberRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileCard(BaseModel):
    id: int
    name: str
    gender: str
    dob: date | None = None
    religion: str | None = None
    caste: str | None = None
    city: str | None = None
    state: str | None = None
    marital_status: str | None = None
    mother_tongue: str | None = None
    bio: str | None = None
    height_cm: int | None = None
    education: str | None = None
    profession: str | None = None
    income_lpa: float | None = None
    photo_url: str | None = None
    photos: list[str] | None = None
    family_details: dict | None = None
    lifestyle: dict | None = None
    physical_attributes: dict | None = None
    horoscope: dict | None = None
    id_verification_status: str | None = None
    last_active: datetime | None = None

    model_config = {"from_attributes": True}


class MemberMeResponse(ProfileCard):
    email: str
    phone: str | None = None
    partner_prefs: dict | None = None
    settings: dict | None = None
    id_document_url: str | None = None


class MemberMeUpdate(BaseModel):
    name: str | None = None
    dob: date | None = None
    religion: str | None = None
    caste: str | None = None
    city: str | None = None
    state: str | None = None
    marital_status: str | None = None
    mother_tongue: str | None = None
    bio: str | None = None
    height_cm: int | None = None
    education: str | None = None
    profession: str | None = None
    income_lpa: float | None = None
    photo_url: str | None = None
    photos: list[str] | None = None
    partner_prefs: dict | None = None
    settings: dict | None = None
    family_details: dict | None = None
    lifestyle: dict | None = None
    physical_attributes: dict | None = None
    horoscope: dict | None = None
    id_document_url: str | None = None


class InterestCreateRequest(BaseModel):
    receiver_id: int
    message: str | None = None


class InterestActionRequest(BaseModel):
    action: str  # "accept" | "reject" | "withdraw"


class MatchOut(BaseModel):
    id: int
    member: ProfileCard
    status: str
    message: str | None = None
    sent_at: datetime
    responded_at: datetime | None = None
    is_sender: bool


class MessageCreateRequest(BaseModel):
    receiver_id: int
    body: str


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    body: str
    created_at: datetime
    read_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    member: ProfileCard
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int


class NotificationItem(BaseModel):
    type: str
    id: str
    title: str
    body: str
    created_at: datetime
    member: ProfileCard | None = None


class ReportCreateRequest(BaseModel):
    reported_id: int
    reason: str
    description: str | None = None


class PlanOut(BaseModel):
    id: int
    name: str
    price: float
    duration_days: int
    features: dict | None = None

    model_config = {"from_attributes": True}


class SubscribeRequest(BaseModel):
    plan_id: int


class BlockCreateRequest(BaseModel):
    blocked_id: int


class BlockOut(BaseModel):
    id: int
    member: ProfileCard
    created_at: datetime


class ProfileViewOut(BaseModel):
    id: int
    member: ProfileCard
    viewed_at: datetime


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class SuccessStoryOut(BaseModel):
    id: int
    title: str
    story: str
    photo_url: str | None = None
    wedding_date: date | None = None
    member_a_name: str | None = None
    member_b_name: str | None = None

    model_config = {"from_attributes": True}
