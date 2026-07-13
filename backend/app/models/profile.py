import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PhotoStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class IdVerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    education: Mapped[str | None] = mapped_column(String(120), nullable=True)
    profession: Mapped[str | None] = mapped_column(String(120), nullable=True)
    income_lpa: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    photo_status: Mapped[PhotoStatus] = mapped_column(Enum(PhotoStatus), default=PhotoStatus.pending, nullable=False)
    partner_prefs: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    photos: Mapped[list | None] = mapped_column(JSON, nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    family_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    lifestyle: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    physical_attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    horoscope: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    id_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    id_verification_status: Mapped[IdVerificationStatus] = mapped_column(
        Enum(IdVerificationStatus), default=IdVerificationStatus.pending, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    member: Mapped["Member"] = relationship(back_populates="profile")
