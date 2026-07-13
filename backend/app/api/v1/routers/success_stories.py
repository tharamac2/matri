from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.success_story import SuccessStory
from app.schemas.common import PaginatedResponse
from app.schemas.success_story import SuccessStoryAdminOut, SuccessStoryCreateRequest, SuccessStoryUpdateRequest

router = APIRouter()


@router.get(
    "/",
    response_model=PaginatedResponse[SuccessStoryAdminOut],
    dependencies=[Depends(require_role("moderator", "viewer"))],
)
def list_success_stories(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    query = db.query(SuccessStory)
    total = query.count()
    items = (
        query.order_by(SuccessStory.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return PaginatedResponse(items=items, total=total, page=page, size=size)


@router.post(
    "/",
    response_model=SuccessStoryAdminOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("moderator"))],
)
def create_success_story(payload: SuccessStoryCreateRequest, db: Session = Depends(get_db)):
    story = SuccessStory(**payload.model_dump())
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


@router.put(
    "/{story_id}",
    response_model=SuccessStoryAdminOut,
    dependencies=[Depends(require_role("moderator"))],
)
def update_success_story(story_id: int, payload: SuccessStoryUpdateRequest, db: Session = Depends(get_db)):
    story = db.query(SuccessStory).filter(SuccessStory.id == story_id).first()
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Success story not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(story, field, value)

    db.add(story)
    db.commit()
    db.refresh(story)
    return story


@router.delete(
    "/{story_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("moderator"))],
)
def delete_success_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(SuccessStory).filter(SuccessStory.id == story_id).first()
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Success story not found")

    db.delete(story)
    db.commit()
    return None
