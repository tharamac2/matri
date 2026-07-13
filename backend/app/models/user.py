from sqlalchemy import Column, ForeignKey, Integer, String, Boolean
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(50), unique=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255))
    profile_for = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), unique=True, nullable=True)
