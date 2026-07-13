from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import (
    admins,
    analytics,
    audit,
    auth,
    matches,
    member_auth,
    member_portal,
    moderation,
    notifications,
    payments,
    reports,
    settings as settings_router,
    subscriptions,
    success_stories,
    users,
)
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["analytics"])
app.include_router(reports.router, prefix=f"{settings.API_V1_PREFIX}/reports", tags=["reports"])
app.include_router(subscriptions.router, prefix=f"{settings.API_V1_PREFIX}/subscriptions", tags=["subscriptions"])
app.include_router(admins.router, prefix=f"{settings.API_V1_PREFIX}/admins", tags=["admins"])
app.include_router(audit.router, prefix=f"{settings.API_V1_PREFIX}/audit", tags=["audit"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_PREFIX}/notifications", tags=["notifications"])
app.include_router(settings_router.router, prefix=f"{settings.API_V1_PREFIX}/settings", tags=["settings"])
app.include_router(moderation.router, prefix=f"{settings.API_V1_PREFIX}/moderation", tags=["moderation"])
app.include_router(matches.router, prefix=f"{settings.API_V1_PREFIX}/matches", tags=["matches"])
app.include_router(payments.router, prefix=f"{settings.API_V1_PREFIX}/payments", tags=["payments"])
app.include_router(success_stories.router, prefix=f"{settings.API_V1_PREFIX}/success-stories", tags=["success_stories"])

# End-user facing app (registration/login/browse/interests/matches/messages/etc.)
app.include_router(member_auth.router, prefix="/api/app/auth", tags=["member_auth"])
app.include_router(member_portal.router, prefix="/api/app", tags=["member_portal"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
