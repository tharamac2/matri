from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_member, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.activity_log import ActivityLog
from app.models.member import Gender as MemberGender, MaritalStatus, Member, MemberStatus
from app.models.user import User
from app.schemas.member_app import (
    ChangePasswordRequest,
    MemberLoginRequest,
    MemberRefreshRequest,
    MemberRefreshResponse,
    MemberRegisterRequest,
    MemberTokenResponse,
)

router = APIRouter()


def _issue_tokens(user: User, name: str) -> MemberTokenResponse:
    return MemberTokenResponse(
        access_token=create_access_token(str(user.id), role="member"),
        refresh_token=create_refresh_token(str(user.id)),
        member_id=user.member_id,
        name=name,
    )


@router.post("/register", response_model=MemberTokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: MemberRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")

    try:
        member_gender = MemberGender(payload.gender.lower())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Gender must be 'male' or 'female'")

    member_marital_status = None
    if payload.marital_status:
        try:
            member_marital_status = MaritalStatus(payload.marital_status)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid marital status")

    placeholder_email = f"{payload.phone_number}@users.matrimonyapp.com"
    member = Member(
        name=payload.name,
        email=placeholder_email,
        phone=payload.phone_number,
        gender=member_gender,
        dob=payload.dob,
        religion=payload.religion,
        caste=payload.caste,
        city=payload.city,
        state=payload.state,
        marital_status=member_marital_status,
        mother_tongue=payload.mother_tongue,
        status=MemberStatus.pending,
        last_active=datetime.utcnow(),
    )
    db.add(member)
    db.flush()

    if payload.education or payload.profession or payload.bio:
        from app.models.profile import Profile

        db.add(
            Profile(
                member_id=member.id,
                bio=payload.bio,
                education=payload.education,
                profession=payload.profession,
            )
        )

    user = User(
        phone_number=payload.phone_number,
        hashed_password=hash_password(payload.password),
        profile_for=payload.profile_for,
        gender=payload.gender,
        member_id=member.id,
    )
    db.add(user)
    db.flush()

    db.add(
        ActivityLog(
            member_id=member.id,
            action="Registered account on web app",
            device="Web Browser",
            ip_address="127.0.0.1",
        )
    )
    db.commit()
    db.refresh(user)

    return _issue_tokens(user, member.name)


@router.post("/login", response_model=MemberTokenResponse)
def login(payload: MemberLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone number or password")

    member = db.query(Member).filter(Member.id == user.member_id).first()
    if member is not None:
        member.last_active = datetime.utcnow()
        db.add(
            ActivityLog(
                member_id=member.id,
                action="Logged in to web application",
                device="Web Browser",
                ip_address="127.0.0.1",
            )
        )
        db.commit()

    return _issue_tokens(user, member.name if member else "")


@router.post("/refresh", response_model=MemberRefreshResponse)
def refresh(payload: MemberRefreshRequest, db: Session = Depends(get_db)):
    token_payload = verify_token(payload.refresh_token, expected_type="refresh")
    if token_payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = token_payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    return MemberRefreshResponse(access_token=create_access_token(str(user.id), role="member"))


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_member),
):
    if not current_user.hashed_password or not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="New password must be at least 6 characters")

    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return None
