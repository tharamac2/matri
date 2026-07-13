from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin, get_db, require_role
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditLog
from app.models.profile import IdVerificationStatus, PhotoStatus, Profile
from app.schemas.common import PaginatedResponse
from app.schemas.moderation import (
    IdDocumentQueueItem,
    IdDocumentStatusUpdateRequest,
    PhotoQueueItem,
    PhotoStatusUpdateRequest,
)

router = APIRouter()

_VALID_TARGET_STATUSES = {PhotoStatus.approved, PhotoStatus.rejected}
_VALID_ID_TARGET_STATUSES = {IdVerificationStatus.approved, IdVerificationStatus.rejected}


def _to_queue_item(profile: Profile) -> PhotoQueueItem:
    return PhotoQueueItem(
        member_id=profile.member_id,
        member_name=profile.member.name,
        member_email=profile.member.email,
        photo_url=profile.photo_url,
        photo_status=profile.photo_status.value,
        updated_at=profile.updated_at,
    )


@router.get(
    "/photos",
    response_model=PaginatedResponse[PhotoQueueItem],
    dependencies=[Depends(require_role("moderator", "viewer"))],
)
def list_photo_queue(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query("pending", alias="status"),
):
    query = db.query(Profile).options(joinedload(Profile.member)).filter(Profile.photo_url.isnot(None))

    if status_filter:
        try:
            query = query.filter(Profile.photo_status == PhotoStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status filter")

    total = query.count()
    rows = (
        query.order_by(Profile.updated_at.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = [_to_queue_item(profile) for profile in rows]
    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.put(
    "/photos/{member_id}",
    response_model=PhotoQueueItem,
    dependencies=[Depends(require_role("moderator"))],
)
def update_photo_status(
    member_id: int,
    payload: PhotoStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    profile = db.query(Profile).options(joinedload(Profile.member)).filter(Profile.member_id == member_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    try:
        new_status = PhotoStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Status must be 'approved' or 'rejected'")

    if new_status not in _VALID_TARGET_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Status must be 'approved' or 'rejected'")

    old_status = profile.photo_status
    profile.photo_status = new_status

    db.add(profile)
    db.add(
        AuditLog(
            admin_id=current_admin.id,
            action=f"photo.{new_status.value}",
            resource_type="profile",
            resource_id=profile.member_id,
            old_value={"photo_status": old_status.value},
            new_value={"photo_status": new_status.value, "note": payload.note},
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()
    db.refresh(profile)

    return _to_queue_item(profile)


def _to_id_queue_item(profile: Profile) -> IdDocumentQueueItem:
    return IdDocumentQueueItem(
        member_id=profile.member_id,
        member_name=profile.member.name,
        member_email=profile.member.email,
        id_document_url=profile.id_document_url,
        id_verification_status=profile.id_verification_status.value,
        updated_at=profile.updated_at,
    )


@router.get(
    "/id-documents",
    response_model=PaginatedResponse[IdDocumentQueueItem],
    dependencies=[Depends(require_role("moderator", "viewer"))],
)
def list_id_document_queue(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query("pending", alias="status"),
):
    query = db.query(Profile).options(joinedload(Profile.member)).filter(Profile.id_document_url.isnot(None))

    if status_filter:
        try:
            query = query.filter(Profile.id_verification_status == IdVerificationStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status filter")

    total = query.count()
    rows = (
        query.order_by(Profile.updated_at.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = [_to_id_queue_item(profile) for profile in rows]
    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.put(
    "/id-documents/{member_id}",
    response_model=IdDocumentQueueItem,
    dependencies=[Depends(require_role("moderator"))],
)
def update_id_document_status(
    member_id: int,
    payload: IdDocumentStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    profile = db.query(Profile).options(joinedload(Profile.member)).filter(Profile.member_id == member_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    try:
        new_status = IdVerificationStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Status must be 'approved' or 'rejected'")

    if new_status not in _VALID_ID_TARGET_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Status must be 'approved' or 'rejected'")

    old_status = profile.id_verification_status
    profile.id_verification_status = new_status

    db.add(profile)
    db.add(
        AuditLog(
            admin_id=current_admin.id,
            action=f"id_document.{new_status.value}",
            resource_type="profile",
            resource_id=profile.member_id,
            old_value={"id_verification_status": old_status.value},
            new_value={"id_verification_status": new_status.value, "note": payload.note},
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()
    db.refresh(profile)

    return _to_id_queue_item(profile)
