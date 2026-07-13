import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Gender(str, enum.Enum):
    male = "male"
    female = "female"


class MemberStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    banned = "banned"
    pending = "pending"


class MaritalStatus(str, enum.Enum):
    never_married = "never_married"
    divorced = "divorced"
    widowed = "widowed"
    awaiting_divorce = "awaiting_divorce"


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=True)
    religion: Mapped[str | None] = mapped_column(String(60), nullable=True)
    caste: Mapped[str | None] = mapped_column(String(60), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    marital_status: Mapped[MaritalStatus | None] = mapped_column(Enum(MaritalStatus), nullable=True)
    mother_tongue: Mapped[str | None] = mapped_column(String(60), nullable=True)
    status: Mapped[MemberStatus] = mapped_column(Enum(MemberStatus), default=MemberStatus.pending, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_active: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    profile: Mapped["Profile"] = relationship(back_populates="member", uselist=False)
