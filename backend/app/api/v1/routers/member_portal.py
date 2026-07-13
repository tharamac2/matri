from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, aliased

from app.api.deps import get_current_member, get_db
from app.models.block import Block
from app.models.match import Match, MatchStatus
from app.models.member import Gender as MemberGender, Member
from app.models.message import Message
from app.models.profile import Profile
from app.models.profile_view import ProfileView
from app.models.report import Report
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_plan import SubscriptionPlan
from app.models.success_story import SuccessStory
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.schemas.member_app import (
    BlockCreateRequest,
    BlockOut,
    ConversationSummary,
    InterestActionRequest,
    InterestCreateRequest,
    MatchOut,
    MemberMeResponse,
    MemberMeUpdate,
    MessageCreateRequest,
    MessageOut,
    NotificationItem,
    PlanOut,
    ProfileCard,
    ProfileViewOut,
    ReportCreateRequest,
    SubscribeRequest,
    SuccessStoryOut,
)

DEFAULT_DAILY_INTEREST_CAP = 5

router = APIRouter()


def _member_or_404(db: Session, current_user: User) -> Member:
    member = db.query(Member).filter(Member.id == current_user.member_id).first()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member profile not found")
    return member


def _to_card(member: Member, profile: Profile | None) -> ProfileCard:
    data = {
        "id": member.id,
        "name": member.name,
        "gender": member.gender.value,
        "dob": member.dob,
        "religion": member.religion,
        "caste": member.caste,
        "city": member.city,
        "state": member.state,
        "marital_status": member.marital_status.value if member.marital_status else None,
        "mother_tongue": member.mother_tongue,
        "last_active": member.last_active,
    }
    if profile is not None:
        data.update(
            bio=profile.bio,
            height_cm=profile.height_cm,
            education=profile.education,
            profession=profile.profession,
            income_lpa=float(profile.income_lpa) if profile.income_lpa is not None else None,
            photo_url=profile.photo_url,
            photos=profile.photos,
            family_details=profile.family_details,
            lifestyle=profile.lifestyle,
            physical_attributes=profile.physical_attributes,
            horoscope=profile.horoscope,
            id_verification_status=profile.id_verification_status.value,
        )
    return ProfileCard(**data)


def _blocked_member_ids(db: Session, self_id: int) -> set[int]:
    rows = db.query(Block).filter(or_(Block.blocker_id == self_id, Block.blocked_id == self_id)).all()
    ids: set[int] = set()
    for row in rows:
        ids.add(row.blocked_id if row.blocker_id == self_id else row.blocker_id)
    return ids


def _daily_interest_cap(db: Session, member_id: int) -> int:
    active_sub = (
        db.query(Subscription)
        .filter(
            Subscription.member_id == member_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.end_date >= date.today(),
        )
        .order_by(Subscription.end_date.desc())
        .first()
    )
    if active_sub is None:
        return DEFAULT_DAILY_INTEREST_CAP

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == active_sub.plan_id).first()
    if plan is None or not plan.features:
        return DEFAULT_DAILY_INTEREST_CAP

    return int(plan.features.get("matches_per_day", DEFAULT_DAILY_INTEREST_CAP))


def _is_blocked(db: Session, member_a: int, member_b: int) -> bool:
    return (
        db.query(Block)
        .filter(
            or_(
                (Block.blocker_id == member_a) & (Block.blocked_id == member_b),
                (Block.blocker_id == member_b) & (Block.blocked_id == member_a),
            )
        )
        .first()
        is not None
    )


# ---- Profile browsing ----

@router.get("/profiles", response_model=list[ProfileCard])
def browse_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
    religion: str | None = Query(None),
    city: str | None = Query(None),
    search: str | None = Query(None),
    age_min: int | None = Query(None, ge=18),
    age_max: int | None = Query(None, ge=18),
    height_min: int | None = Query(None, ge=100),
    height_max: int | None = Query(None, ge=100),
    marital_status: str | None = Query(None),
    mother_tongue: str | None = Query(None),
    profession: str | None = Query(None),
    income_min: float | None = Query(None, ge=0),
    income_max: float | None = Query(None, ge=0),
    member_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    me = db.query(Member).filter(Member.id == current_user.member_id).first()
    if me is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member profile not found")

    opposite_gender = MemberGender.female if me.gender == MemberGender.male else MemberGender.male
    query = db.query(Member).filter(Member.id != current_user.member_id, Member.gender == opposite_gender)

    blocked_ids = _blocked_member_ids(db, current_user.member_id)
    if blocked_ids:
        query = query.filter(Member.id.notin_(blocked_ids))

    if religion:
        query = query.filter(Member.religion == religion)
    if city:
        query = query.filter(Member.city.ilike(f"%{city}%"))
    if search:
        query = query.filter(Member.name.ilike(f"%{search}%"))
    if age_min is not None:
        query = query.filter(Member.dob <= date.today().replace(year=date.today().year - age_min))
    if age_max is not None:
        query = query.filter(Member.dob >= date.today().replace(year=date.today().year - age_max - 1))
    if marital_status:
        query = query.filter(Member.marital_status == marital_status)
    if mother_tongue:
        query = query.filter(Member.mother_tongue.ilike(f"%{mother_tongue}%"))
    if member_id is not None:
        query = query.filter(Member.id == member_id)

    needs_profile_join = any(v is not None for v in (height_min, height_max, income_min, income_max)) or profession
    if needs_profile_join:
        query = query.join(Profile, Profile.member_id == Member.id)
        if height_min is not None:
            query = query.filter(Profile.height_cm >= height_min)
        if height_max is not None:
            query = query.filter(Profile.height_cm <= height_max)
        if income_min is not None:
            query = query.filter(Profile.income_lpa >= income_min)
        if income_max is not None:
            query = query.filter(Profile.income_lpa <= income_max)
        if profession:
            query = query.filter(Profile.profession.ilike(f"%{profession}%"))

    members = query.order_by(Member.created_at.desc()).offset((page - 1) * size).limit(size).all()
    member_ids = [m.id for m in members]
    profiles = {p.member_id: p for p in db.query(Profile).filter(Profile.member_id.in_(member_ids)).all()}

    return [_to_card(m, profiles.get(m.id)) for m in members]


@router.get("/profiles/{member_id}", response_model=ProfileCard)
def get_profile(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    profile = db.query(Profile).filter(Profile.member_id == member_id).first()

    if member_id != current_user.member_id:
        today_start = datetime.combine(date.today(), datetime.min.time())
        already_viewed_today = (
            db.query(ProfileView)
            .filter(
                ProfileView.viewer_id == current_user.member_id,
                ProfileView.viewed_id == member_id,
                ProfileView.viewed_at >= today_start,
            )
            .first()
        )
        if already_viewed_today is None:
            db.add(ProfileView(viewer_id=current_user.member_id, viewed_id=member_id))
            db.commit()

    return _to_card(member, profile)


# ---- Self profile ----

@router.get("/me", response_model=MemberMeResponse)
def get_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    member = _member_or_404(db, current_user)
    profile = db.query(Profile).filter(Profile.member_id == member.id).first()
    card = _to_card(member, profile).model_dump()
    card.update(
        email=member.email,
        phone=member.phone,
        partner_prefs=profile.partner_prefs if profile else None,
        settings=profile.settings if profile else None,
        id_document_url=profile.id_document_url if profile else None,
    )
    return MemberMeResponse(**card)


@router.put("/me", response_model=MemberMeResponse)
def update_me(
    payload: MemberMeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    member = _member_or_404(db, current_user)
    profile = db.query(Profile).filter(Profile.member_id == member.id).first()
    if profile is None:
        profile = Profile(member_id=member.id)
        db.add(profile)

    member_fields = {"name", "dob", "religion", "caste", "city", "state", "marital_status", "mother_tongue"}
    profile_fields = {
        "bio", "height_cm", "education", "profession", "income_lpa",
        "photo_url", "photos", "partner_prefs", "settings",
        "family_details", "lifestyle", "physical_attributes", "horoscope", "id_document_url",
    }

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in member_fields:
            setattr(member, field, value)
        elif field in profile_fields:
            setattr(profile, field, value)

    db.add(member)
    db.commit()
    db.refresh(member)
    db.refresh(profile)

    card = _to_card(member, profile).model_dump()
    card.update(
        email=member.email,
        phone=member.phone,
        partner_prefs=profile.partner_prefs,
        settings=profile.settings,
        id_document_url=profile.id_document_url,
    )
    return MemberMeResponse(**card)


# ---- Interests (Match model) ----

@router.post("/interests", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
def send_interest(
    payload: InterestCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    self_id = current_user.member_id
    if payload.receiver_id == self_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot send interest to yourself")

    receiver = db.query(Member).filter(Member.id == payload.receiver_id).first()
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    if _is_blocked(db, self_id, payload.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot interact with this member")

    today_start = datetime.combine(date.today(), datetime.min.time())
    sent_today = (
        db.query(Match)
        .filter(Match.sender_id == self_id, Match.sent_at >= today_start)
        .count()
    )
    cap = _daily_interest_cap(db, self_id)
    if sent_today >= cap:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You've reached your daily limit of {cap} interests. Upgrade your plan to send more.",
        )

    existing = (
        db.query(Match)
        .filter(
            or_(
                (Match.sender_id == self_id) & (Match.receiver_id == payload.receiver_id),
                (Match.sender_id == payload.receiver_id) & (Match.receiver_id == self_id),
            )
        )
        .first()
    )
    if existing is not None:
        profile = db.query(Profile).filter(Profile.member_id == receiver.id).first()
        return MatchOut(
            id=existing.id,
            member=_to_card(receiver, profile),
            status=existing.status.value,
            message=existing.message,
            sent_at=existing.sent_at,
            responded_at=existing.responded_at,
            is_sender=existing.sender_id == self_id,
        )

    match = Match(
        sender_id=self_id,
        receiver_id=payload.receiver_id,
        status=MatchStatus.pending,
        message=payload.message,
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    profile = db.query(Profile).filter(Profile.member_id == receiver.id).first()
    return MatchOut(
        id=match.id,
        member=_to_card(receiver, profile),
        status=match.status.value,
        message=match.message,
        sent_at=match.sent_at,
        responded_at=match.responded_at,
        is_sender=True,
    )


def _match_list(db: Session, self_id: int, matches: list[Match]) -> list[MatchOut]:
    other_ids = [m.receiver_id if m.sender_id == self_id else m.sender_id for m in matches]
    members = {m.id: m for m in db.query(Member).filter(Member.id.in_(other_ids)).all()}
    profiles = {p.member_id: p for p in db.query(Profile).filter(Profile.member_id.in_(other_ids)).all()}

    result = []
    for match in matches:
        other_id = match.receiver_id if match.sender_id == self_id else match.sender_id
        other = members.get(other_id)
        if other is None:
            continue
        result.append(
            MatchOut(
                id=match.id,
                member=_to_card(other, profiles.get(other_id)),
                status=match.status.value,
                message=match.message,
                sent_at=match.sent_at,
                responded_at=match.responded_at,
                is_sender=match.sender_id == self_id,
            )
        )
    return result


@router.get("/interests/received", response_model=list[MatchOut])
def interests_received(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    matches = (
        db.query(Match)
        .filter(Match.receiver_id == current_user.member_id, Match.status == MatchStatus.pending)
        .order_by(Match.sent_at.desc())
        .all()
    )
    return _match_list(db, current_user.member_id, matches)


@router.get("/interests/sent", response_model=list[MatchOut])
def interests_sent(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    matches = (
        db.query(Match)
        .filter(Match.sender_id == current_user.member_id)
        .order_by(Match.sent_at.desc())
        .all()
    )
    return _match_list(db, current_user.member_id, matches)


@router.put("/interests/{match_id}", response_model=MatchOut)
def act_on_interest(
    match_id: int,
    payload: InterestActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interest not found")
    if match.status != MatchStatus.pending:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Interest already actioned")

    if payload.action == "withdraw":
        if match.sender_id != current_user.member_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your interest to withdraw")
        match.status = MatchStatus.withdrawn
    else:
        if match.receiver_id != current_user.member_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your interest to act on")
        if payload.action == "accept":
            match.status = MatchStatus.accepted
        elif payload.action == "reject":
            match.status = MatchStatus.rejected
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Action must be 'accept', 'reject', or 'withdraw'",
            )

    match.responded_at = datetime.utcnow()
    db.add(match)
    db.commit()
    db.refresh(match)

    return _match_list(db, current_user.member_id, [match])[0]


@router.get("/matches", response_model=list[MatchOut])
def list_matches(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    self_id = current_user.member_id
    matches = (
        db.query(Match)
        .filter(
            or_(Match.sender_id == self_id, Match.receiver_id == self_id),
            Match.status == MatchStatus.accepted,
        )
        .order_by(Match.responded_at.desc())
        .all()
    )
    return _match_list(db, self_id, matches)


# ---- Messaging ----

@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    self_id = current_user.member_id
    messages = (
        db.query(Message)
        .filter(or_(Message.sender_id == self_id, Message.receiver_id == self_id))
        .order_by(Message.created_at.desc())
        .all()
    )

    by_other: dict[int, list[Message]] = {}
    for msg in messages:
        other_id = msg.receiver_id if msg.sender_id == self_id else msg.sender_id
        by_other.setdefault(other_id, []).append(msg)

    other_ids = list(by_other.keys())
    members = {m.id: m for m in db.query(Member).filter(Member.id.in_(other_ids)).all()}
    profiles = {p.member_id: p for p in db.query(Profile).filter(Profile.member_id.in_(other_ids)).all()}

    summaries = []
    for other_id, msgs in by_other.items():
        other = members.get(other_id)
        if other is None:
            continue
        latest = msgs[0]
        unread = sum(1 for m in msgs if m.receiver_id == self_id and m.read_at is None)
        summaries.append(
            ConversationSummary(
                member=_to_card(other, profiles.get(other_id)),
                last_message=latest.body,
                last_message_at=latest.created_at,
                unread_count=unread,
            )
        )

    summaries.sort(key=lambda s: s.last_message_at or datetime.min, reverse=True)
    return summaries


@router.get("/messages/{member_id}", response_model=list[MessageOut])
def get_thread(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    self_id = current_user.member_id
    thread = (
        db.query(Message)
        .filter(
            or_(
                (Message.sender_id == self_id) & (Message.receiver_id == member_id),
                (Message.sender_id == member_id) & (Message.receiver_id == self_id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    unread = [m for m in thread if m.receiver_id == self_id and m.read_at is None]
    if unread:
        for m in unread:
            m.read_at = datetime.utcnow()
            db.add(m)
        db.commit()

    return thread


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    receiver = db.query(Member).filter(Member.id == payload.receiver_id).first()
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    if _is_blocked(db, current_user.member_id, payload.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot message this member")

    message = Message(sender_id=current_user.member_id, receiver_id=payload.receiver_id, body=payload.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


# ---- Notifications (synthesized, no dedicated table) ----

@router.get("/notifications", response_model=list[NotificationItem])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    self_id = current_user.member_id
    items: list[NotificationItem] = []

    received = (
        db.query(Match)
        .filter(Match.receiver_id == self_id, Match.status == MatchStatus.pending)
        .order_by(Match.sent_at.desc())
        .limit(15)
        .all()
    )
    accepted = (
        db.query(Match)
        .filter(or_(Match.sender_id == self_id, Match.receiver_id == self_id), Match.status == MatchStatus.accepted)
        .order_by(Match.responded_at.desc())
        .limit(15)
        .all()
    )
    recent_messages = (
        db.query(Message)
        .filter(Message.receiver_id == self_id)
        .order_by(Message.created_at.desc())
        .limit(15)
        .all()
    )

    other_ids = {m.sender_id for m in received} | {
        (m.receiver_id if m.sender_id == self_id else m.sender_id) for m in accepted
    } | {m.sender_id for m in recent_messages}
    members = {m.id: m for m in db.query(Member).filter(Member.id.in_(other_ids)).all()}
    profiles = {p.member_id: p for p in db.query(Profile).filter(Profile.member_id.in_(other_ids)).all()}

    def card_for(mid: int) -> ProfileCard | None:
        m = members.get(mid)
        return _to_card(m, profiles.get(mid)) if m else None

    for match in received:
        items.append(
            NotificationItem(
                type="interest_received",
                id=f"interest-{match.id}",
                title="New interest received",
                body=f"{members.get(match.sender_id).name if members.get(match.sender_id) else 'Someone'} sent you an interest",
                created_at=match.sent_at,
                member=card_for(match.sender_id),
            )
        )

    for match in accepted:
        other_id = match.receiver_id if match.sender_id == self_id else match.sender_id
        items.append(
            NotificationItem(
                type="match_accepted",
                id=f"match-{match.id}",
                title="You have a new match",
                body=f"You and {members.get(other_id).name if members.get(other_id) else 'someone'} accepted each other",
                created_at=match.responded_at or match.sent_at,
                member=card_for(other_id),
            )
        )

    for msg in recent_messages:
        items.append(
            NotificationItem(
                type="message",
                id=f"message-{msg.id}",
                title="New message",
                body=msg.body[:80],
                created_at=msg.created_at,
                member=card_for(msg.sender_id),
            )
        )

    items.sort(key=lambda i: i.created_at, reverse=True)
    return items[:30]


# ---- Reports ----

@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    reported = db.query(Member).filter(Member.id == payload.reported_id).first()
    if reported is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    report = Report(
        reporter_id=current_user.member_id,
        reported_id=payload.reported_id,
        reason=payload.reason,
        description=payload.description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": report.id, "status": report.status.value}


# ---- Blocks ----

@router.post("/blocks", status_code=status.HTTP_201_CREATED)
def block_member(
    payload: BlockCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    if payload.blocked_id == current_user.member_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot block yourself")

    target = db.query(Member).filter(Member.id == payload.blocked_id).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    existing = (
        db.query(Block)
        .filter(Block.blocker_id == current_user.member_id, Block.blocked_id == payload.blocked_id)
        .first()
    )
    if existing is None:
        db.add(Block(blocker_id=current_user.member_id, blocked_id=payload.blocked_id))
        db.commit()

    return {"blocked_id": payload.blocked_id}


@router.get("/blocks", response_model=list[BlockOut])
def list_blocks(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    rows = db.query(Block).filter(Block.blocker_id == current_user.member_id).order_by(Block.created_at.desc()).all()
    other_ids = [r.blocked_id for r in rows]
    members = {m.id: m for m in db.query(Member).filter(Member.id.in_(other_ids)).all()}
    profiles = {p.member_id: p for p in db.query(Profile).filter(Profile.member_id.in_(other_ids)).all()}

    return [
        BlockOut(id=r.id, member=_to_card(members[r.blocked_id], profiles.get(r.blocked_id)), created_at=r.created_at)
        for r in rows
        if r.blocked_id in members
    ]


@router.delete("/blocks/{blocked_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock_member(blocked_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    row = (
        db.query(Block)
        .filter(Block.blocker_id == current_user.member_id, Block.blocked_id == blocked_id)
        .first()
    )
    if row is not None:
        db.delete(row)
        db.commit()
    return None


# ---- Profile views ----

@router.get("/profile-views", response_model=list[ProfileViewOut])
def list_profile_views(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    rows = (
        db.query(ProfileView)
        .filter(ProfileView.viewed_id == current_user.member_id)
        .order_by(ProfileView.viewed_at.desc())
        .limit(50)
        .all()
    )
    other_ids = [r.viewer_id for r in rows]
    members = {m.id: m for m in db.query(Member).filter(Member.id.in_(other_ids)).all()}
    profiles = {p.member_id: p for p in db.query(Profile).filter(Profile.member_id.in_(other_ids)).all()}

    return [
        ProfileViewOut(id=r.id, member=_to_card(members[r.viewer_id], profiles.get(r.viewer_id)), viewed_at=r.viewed_at)
        for r in rows
        if r.viewer_id in members
    ]


# ---- Plans / subscribe ----

@router.get("/plans", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active.is_(True)).order_by(SubscriptionPlan.price).all()


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
def subscribe(
    payload: SubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.plan_id).first()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    start = date.today()
    from datetime import timedelta

    end = start + timedelta(days=plan.duration_days)

    subscription = Subscription(
        member_id=current_user.member_id,
        plan_id=plan.id,
        start_date=start,
        end_date=end,
        status=SubscriptionStatus.active,
        auto_renew=False,
    )
    db.add(subscription)
    db.flush()

    if plan.price > 0:
        db.add(
            Payment(
                member_id=current_user.member_id,
                subscription_id=subscription.id,
                amount=plan.price,
                gateway="prototype",
                txn_id=f"proto_{subscription.id}_{int(datetime.utcnow().timestamp())}",
                status=PaymentStatus.success,
                paid_at=datetime.utcnow(),
            )
        )

    db.commit()
    return {"subscription_id": subscription.id, "status": subscription.status.value, "end_date": str(end)}


@router.get("/success-stories", response_model=list[SuccessStoryOut])
def list_public_success_stories(db: Session = Depends(get_db), current_user: User = Depends(get_current_member)):
    stories = (
        db.query(SuccessStory)
        .filter(SuccessStory.is_published.is_(True))
        .order_by(SuccessStory.created_at.desc())
        .all()
    )

    member_ids = {s.member_a_id for s in stories if s.member_a_id} | {s.member_b_id for s in stories if s.member_b_id}
    members = {m.id: m for m in db.query(Member).filter(Member.id.in_(member_ids)).all()} if member_ids else {}

    return [
        SuccessStoryOut(
            id=s.id,
            title=s.title,
            story=s.story,
            photo_url=s.photo_url,
            wedding_date=s.wedding_date,
            member_a_name=members[s.member_a_id].name if s.member_a_id in members else None,
            member_b_name=members[s.member_b_id].name if s.member_b_id in members else None,
        )
        for s in stories
    ]
