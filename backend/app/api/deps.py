from collections.abc import Generator
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.db.session import SessionLocal
from app.models.admin_user import AdminUser
from app.models.member import Member
from app.models.user import User

LAST_ACTIVE_TOUCH_INTERVAL = timedelta(minutes=2)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
member_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/app/auth/login")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token, expected_type="access")
    if payload is None:
        raise credentials_exception

    admin_id = payload.get("sub")
    if admin_id is None:
        raise credentials_exception

    admin = db.query(AdminUser).filter(AdminUser.id == int(admin_id)).first()
    if admin is None or not admin.is_active:
        raise credentials_exception

    return admin


def get_current_member(
    token: str = Depends(member_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token, expected_type="access")
    if payload is None or payload.get("role") != "member":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    if user.member_id is not None:
        member = db.query(Member).filter(Member.id == user.member_id).first()
        now = datetime.utcnow()
        if member is not None and (member.last_active is None or now - member.last_active > LAST_ACTIVE_TOUCH_INTERVAL):
            member.last_active = now
            db.add(member)
            db.commit()

    return user


def require_role(*allowed_roles: str):
    """super_admin always passes; other roles must be explicitly listed."""

    def role_checker(current_admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
        role = current_admin.role.value
        if role != "super_admin" and role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_admin

    return role_checker
