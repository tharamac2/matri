from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db, require_role
from app.models.admin_user import AdminUser
from app.models.report import Report, ReportStatus
from app.schemas.common import PaginatedResponse
from app.schemas.report import ReportActionRequest, ReportResponse

router = APIRouter()

_ACTION_TO_STATUS = {
    "review": ReportStatus.reviewed,
    "resolve": ReportStatus.resolved,
    "dismiss": ReportStatus.dismissed,
}


@router.get("/", response_model=PaginatedResponse[ReportResponse], dependencies=[Depends(require_role("moderator", "viewer"))])
def list_reports(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
):
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)

    total = query.count()
    items = (
        query.order_by(Report.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.get("/{report_id}", response_model=ReportResponse, dependencies=[Depends(require_role("moderator", "viewer"))])
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.put("/{report_id}/action", response_model=ReportResponse, dependencies=[Depends(require_role("moderator"))])
def act_on_report(
    report_id: int,
    payload: ReportActionRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    new_status = _ACTION_TO_STATUS.get(payload.action)
    if new_status is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported action")

    report.status = new_status
    report.reviewed_by = current_admin.id
    if payload.note is not None:
        report.resolution_note = payload.note
    if new_status in (ReportStatus.resolved, ReportStatus.dismissed):
        report.resolved_at = datetime.utcnow()

    db.add(report)
    db.commit()
    db.refresh(report)
    return report
