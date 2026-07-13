from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, aliased

from app.api.deps import get_db, require_role
from app.models.match import Match, MatchStatus
from app.models.member import Member
from app.schemas.common import PaginatedResponse
from app.schemas.match import MatchMemberSummary, MatchResponse

router = APIRouter(dependencies=[Depends(require_role("moderator", "viewer"))])

SenderMember = aliased(Member)
ReceiverMember = aliased(Member)


def _to_match_response(match: Match, sender: Member, receiver: Member) -> MatchResponse:
    return MatchResponse(
        id=match.id,
        sender=MatchMemberSummary.model_validate(sender),
        receiver=MatchMemberSummary.model_validate(receiver),
        status=match.status.value,
        sent_at=match.sent_at,
        responded_at=match.responded_at,
    )


@router.get("/", response_model=PaginatedResponse[MatchResponse])
def list_matches(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    member_id: int | None = Query(None),
):
    query = (
        db.query(Match, SenderMember, ReceiverMember)
        .join(SenderMember, Match.sender_id == SenderMember.id)
        .join(ReceiverMember, Match.receiver_id == ReceiverMember.id)
    )

    if status_filter:
        try:
            query = query.filter(Match.status == MatchStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status filter")

    if member_id:
        query = query.filter((Match.sender_id == member_id) | (Match.receiver_id == member_id))

    total = query.count()
    rows = (
        query.order_by(Match.sent_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = [_to_match_response(match, sender, receiver) for match, sender, receiver in rows]
    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Match, SenderMember, ReceiverMember)
        .join(SenderMember, Match.sender_id == SenderMember.id)
        .join(ReceiverMember, Match.receiver_id == ReceiverMember.id)
        .filter(Match.id == match_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match, sender, receiver = row
    return _to_match_response(match, sender, receiver)
