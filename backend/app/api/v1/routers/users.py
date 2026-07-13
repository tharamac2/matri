import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db, require_role
from app.models.activity_log import ActivityLog
from app.models.admin_user import AdminUser
from app.models.member import Member, MemberStatus
from app.models.profile import Profile
from app.schemas.common import PaginatedResponse
from app.schemas.user import (
    ActivityLogResponse,
    BulkActionRequest,
    BulkActionResponse,
    MemberDetailResponse,
    MemberResponse,
    UpdateStatusRequest,
)

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[MemberResponse], dependencies=[Depends(require_role("moderator", "viewer"))])
def list_users(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    gender: str | None = Query(None),
    religion: str | None = Query(None),
    city: str | None = Query(None),
    search: str | None = Query(None),
):
    query = db.query(Member)

    if status_filter:
        query = query.filter(Member.status == status_filter)
    if gender:
        query = query.filter(Member.gender == gender)
    if religion:
        query = query.filter(Member.religion == religion)
    if city:
        query = query.filter(Member.city.ilike(f"%{city}%"))
    if search:
        like = f"%{search}%"
        query = query.filter((Member.name.ilike(like)) | (Member.email.ilike(like)))

    total = query.count()
    items = (
        query.order_by(Member.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.get("/export")
def export_users(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_role("moderator", "viewer")),
    status_filter: str | None = Query(None, alias="status"),
):
    query = db.query(Member)
    if status_filter:
        query = query.filter(Member.status == status_filter)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "name", "email", "phone", "gender", "city", "state", "status", "created_at"])
    for member in query.order_by(Member.id).all():
        writer.writerow([
            member.id,
            member.name,
            member.email,
            member.phone,
            member.gender.value,
            member.city,
            member.state,
            member.status.value,
            member.created_at.isoformat(),
        ])

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=members_export.csv"},
    )


@router.get("/{user_id}", response_model=MemberDetailResponse, dependencies=[Depends(require_role("moderator", "viewer"))])
def get_user(user_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == user_id).first()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    profile = db.query(Profile).filter(Profile.member_id == user_id).first()

    data = MemberResponse.model_validate(member).model_dump()
    if profile is not None:
        data.update(
            bio=profile.bio,
            height_cm=profile.height_cm,
            education=profile.education,
            profession=profile.profession,
            income_lpa=float(profile.income_lpa) if profile.income_lpa is not None else None,
            photo_url=profile.photo_url,
            photo_status=profile.photo_status.value,
            partner_prefs=profile.partner_prefs,
        )

    return MemberDetailResponse(**data)


@router.get(
    "/{user_id}/activity",
    response_model=PaginatedResponse[ActivityLogResponse],
    dependencies=[Depends(require_role("moderator", "viewer"))],
)
def list_user_activity(
    user_id: int,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    member = db.query(Member).filter(Member.id == user_id).first()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    query = db.query(ActivityLog).filter(ActivityLog.member_id == user_id)
    total = query.count()
    items = (
        query.order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.put("/{user_id}/status", response_model=MemberResponse, dependencies=[Depends(require_role("moderator"))])
def update_user_status(user_id: int, payload: UpdateStatusRequest, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == user_id).first()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    try:
        member.status = MemberStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status value")

    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role())])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == user_id).first()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    db.delete(member)
    db.commit()
    return None


@router.post("/bulk-action", response_model=BulkActionResponse, dependencies=[Depends(require_role("moderator"))])
def bulk_action(payload: BulkActionRequest, db: Session = Depends(get_db)):
    members = db.query(Member).filter(Member.id.in_(payload.member_ids)).all()
    if not members:
        return BulkActionResponse(updated=0, action=payload.action)

    if payload.action in {status_value.value for status_value in MemberStatus}:
        new_status = MemberStatus(payload.action)
        for member in members:
            member.status = new_status
            db.add(member)
        db.commit()
        return BulkActionResponse(updated=len(members), action=payload.action)

    if payload.action == "delete":
        for member in members:
            db.delete(member)
        db.commit()
        return BulkActionResponse(updated=len(members), action=payload.action)

    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported bulk action")
