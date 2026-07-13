from fastapi import APIRouter, Depends

from app.api.deps import require_role
from app.schemas.settings import PlatformSettings, UpdateSettingsRequest

router = APIRouter()

# No settings table is defined in the schema; settings are kept in-process.
# Swap this for a persisted key/value table without changing the route contracts.
_settings = PlatformSettings()


@router.get("/", response_model=PlatformSettings, dependencies=[Depends(require_role("moderator", "viewer"))])
def get_settings():
    return _settings


@router.put("/", response_model=PlatformSettings, dependencies=[Depends(require_role())])
def update_settings(payload: UpdateSettingsRequest):
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(_settings, field, value)
    return _settings
