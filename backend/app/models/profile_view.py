from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProfileView(Base):
    __tablename__ = "profile_views"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    viewer_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    viewed_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    viewed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
