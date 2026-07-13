from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.match import Match, MatchStatus
from app.models.member import Member
from app.models.payment import Payment, PaymentStatus
from app.models.report import Report, ReportStatus
from app.schemas.analytics import (
    DemographicSlice,
    DemographicsResponse,
    MatchInsightsResponse,
    MatchTrendPoint,
    OverviewResponse,
    RegistrationPoint,
    RegistrationsResponse,
    RevenuePoint,
    RevenueResponse,
)

router = APIRouter(dependencies=[Depends(require_role("moderator", "viewer"))])


@router.get("/overview", response_model=OverviewResponse)
def overview(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    month_start = today_start.replace(day=1)

    total_users = db.query(func.count(Member.id)).scalar() or 0
    active_today = db.query(func.count(Member.id)).filter(Member.last_active >= today_start).scalar() or 0
    new_this_week = db.query(func.count(Member.id)).filter(Member.created_at >= week_start).scalar() or 0
    total_matches = db.query(func.count(Match.id)).scalar() or 0
    pending_reports = db.query(func.count(Report.id)).filter(Report.status == ReportStatus.pending).scalar() or 0
    monthly_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.success, Payment.paid_at >= month_start)
        .scalar()
        or 0
    )

    return OverviewResponse(
        total_users=total_users,
        active_today=active_today,
        new_this_week=new_this_week,
        total_matches=total_matches,
        pending_reports=pending_reports,
        monthly_revenue=float(monthly_revenue),
    )


@router.get("/registrations", response_model=RegistrationsResponse)
def registrations(db: Session = Depends(get_db), days: int = Query(30, ge=1, le=365)):
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(func.date(Member.created_at).label("day"), func.count(Member.id).label("count"))
        .filter(Member.created_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    points = [RegistrationPoint(date=str(row.day), count=row.count) for row in rows]
    return RegistrationsResponse(points=points)


@router.get("/demographics", response_model=DemographicsResponse)
def demographics(db: Session = Depends(get_db)):
    by_gender_rows = db.query(Member.gender, func.count(Member.id)).group_by(Member.gender).all()
    by_religion_rows = (
        db.query(Member.religion, func.count(Member.id))
        .filter(Member.religion.isnot(None))
        .group_by(Member.religion)
        .all()
    )

    by_gender = [DemographicSlice(label=gender.value, count=count) for gender, count in by_gender_rows]
    by_religion = [DemographicSlice(label=religion, count=count) for religion, count in by_religion_rows]

    age_buckets = {"18-25": 0, "26-35": 0, "36-45": 0, "46+": 0}
    today = datetime.utcnow().date()
    for (dob,) in db.query(Member.dob).filter(Member.dob.isnot(None)).all():
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age <= 25:
            age_buckets["18-25"] += 1
        elif age <= 35:
            age_buckets["26-35"] += 1
        elif age <= 45:
            age_buckets["36-45"] += 1
        else:
            age_buckets["46+"] += 1

    by_age_group = [DemographicSlice(label=label, count=count) for label, count in age_buckets.items()]

    return DemographicsResponse(by_gender=by_gender, by_religion=by_religion, by_age_group=by_age_group)


@router.get("/revenue", response_model=RevenueResponse)
def revenue(db: Session = Depends(get_db), days: int = Query(30, ge=1, le=365)):
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(func.date(Payment.paid_at).label("day"), func.coalesce(func.sum(Payment.amount), 0).label("amount"))
        .filter(Payment.status == PaymentStatus.success, Payment.paid_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    points = [RevenuePoint(date=str(row.day), amount=float(row.amount)) for row in rows]
    total = sum(point.amount for point in points)
    return RevenueResponse(points=points, total=total)


@router.get("/matches", response_model=MatchInsightsResponse)
def match_insights(db: Session = Depends(get_db), days: int = Query(30, ge=1, le=365)):
    since = datetime.utcnow() - timedelta(days=days)

    status_rows = db.query(Match.status, func.count(Match.id)).group_by(Match.status).all()
    by_status = [DemographicSlice(label=match_status.value, count=count) for match_status, count in status_rows]
    total_matches = sum(count for _, count in status_rows)
    accepted = next((count for match_status, count in status_rows if match_status == MatchStatus.accepted), 0)
    acceptance_rate = round((accepted / total_matches) * 100, 1) if total_matches else 0.0

    trend_rows = (
        db.query(func.date(Match.sent_at).label("day"), func.count(Match.id).label("count"))
        .filter(Match.sent_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    trend = [MatchTrendPoint(date=str(row.day), count=row.count) for row in trend_rows]

    return MatchInsightsResponse(
        by_status=by_status,
        trend=trend,
        total_matches=total_matches,
        acceptance_rate=acceptance_rate,
    )
