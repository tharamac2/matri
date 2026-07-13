from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.admin_user import AdminUser
from app.schemas.auth import (
    ChangePasswordRequest,
    CurrentAdmin,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RefreshResponse,
    TokenResponse,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == payload.email).first()

    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    admin.last_login = datetime.utcnow()
    db.add(admin)
    db.commit()

    return TokenResponse(
        access_token=create_access_token(str(admin.id), role=admin.role.value),
        refresh_token=create_refresh_token(str(admin.id)),
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_payload = verify_token(payload.refresh_token, expected_type="refresh")
    if token_payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    admin_id = token_payload.get("sub")
    admin = db.query(AdminUser).filter(AdminUser.id == int(admin_id)).first()
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    return RefreshResponse(access_token=create_access_token(str(admin.id), role=admin.role.value))


@router.get("/me", response_model=CurrentAdmin)
def me(current_admin: AdminUser = Depends(get_current_admin)):
    return current_admin


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    if not verify_password(payload.current_password, current_admin.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="New password must be at least 6 characters")

    current_admin.password_hash = hash_password(payload.new_password)
    db.add(current_admin)
    db.commit()
    return None


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, current_admin: AdminUser = Depends(get_current_admin)):
    # Stateless JWT setup: logout is enforced client-side by discarding tokens.
    # Validate the refresh token belongs to the current session before acknowledging.
    token_payload = verify_token(payload.refresh_token, expected_type="refresh")
    if token_payload is None or token_payload.get("sub") != str(current_admin.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token does not match current session")
    return None
