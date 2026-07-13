from pydantic import BaseModel


class PlatformSettings(BaseModel):
    site_name: str = "Matrimony Admin"
    support_email: str = "support@matrimony.example"
    maintenance_mode: bool = False
    max_photos_per_profile: int = 6
    auto_approve_photos: bool = False


class UpdateSettingsRequest(BaseModel):
    site_name: str | None = None
    support_email: str | None = None
    maintenance_mode: bool | None = None
    max_photos_per_profile: int | None = None
    auto_approve_photos: bool | None = None
