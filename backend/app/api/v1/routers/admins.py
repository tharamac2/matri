from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db, require_role
from app.core.security import hash_password
from app.models.admin_user import AdminRole, AdminUser
from app.models.audit_log import AuditLog
from app.schemas.admin import AdminCreateRequest, AdminResponse, AdminUpdateRequest

router = APIRouter(dependencies=[Depends(require_role())])


def _record_audit(db: Session, admin: AdminUser, request: Request, action: str, target: AdminUser, old_value: dict | None, new_value: dict | None):
    db.add(
        AuditLog(
            admin_id=admin.id,
            action=action,
            resource_type="admin_user",
            resource_id=target.id,
            old_value=old_value,
            new_value=new_value,
            ip_address=request.client.host if request.client else None,
        )
    )


@router.get("/", response_model=list[AdminResponse])
def list_admins(db: Session = Depends(get_db)):
    return db.query(AdminUser).order_by(AdminUser.created_at.desc()).all()


@router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: AdminCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    if db.query(AdminUser).filter(AdminUser.email == payload.email).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    try:
        role = AdminRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")

    admin = AdminUser(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role,
    )
    db.add(admin)
    db.flush()

    _record_audit(db, current_admin, request, "create", admin, None, {"name": admin.name, "email": admin.email, "role": role.value})
    db.commit()
    db.refresh(admin)
    return admin


@router.put("/{admin_id}", response_model=AdminResponse)
def update_admin(
    admin_id: int,
    payload: AdminUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    old_value = {"name": admin.name, "role": admin.role.value, "is_active": admin.is_active}

    if payload.name is not None:
        admin.name = payload.name
    if payload.role is not None:
        try:
            admin.role = AdminRole(payload.role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")
    if payload.is_active is not None:
        admin.is_active = payload.is_active

    new_value = {"name": admin.name, "role": admin.role.value, "is_active": admin.is_active}

    db.add(admin)
    _record_audit(db, current_admin, request, "update", admin, old_value, new_value)
    db.commit()
    db.refresh(admin)
    return admin


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    admin_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    if admin_id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")

    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    old_value = {"name": admin.name, "email": admin.email, "role": admin.role.value}
    _record_audit(db, current_admin, request, "delete", admin, old_value, None)
    db.delete(admin)
    db.commit()
    return None
