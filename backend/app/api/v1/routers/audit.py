from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.audit_log import AuditLog
from app.schemas.admin import AuditLogResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(dependencies=[Depends(require_role())])


@router.get("/logs", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin_id: int | None = Query(None),
    resource_type: str | None = Query(None),
):
    query = db.query(AuditLog)
    if admin_id:
        query = query.filter(AuditLog.admin_id == admin_id)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    total = query.count()
    items = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedResponse(items=items, total=total, page=page, size=size)
