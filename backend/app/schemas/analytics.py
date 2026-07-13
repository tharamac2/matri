from pydantic import BaseModel


class OverviewResponse(BaseModel):
    total_users: int
    active_today: int
    new_this_week: int
    total_matches: int
    pending_reports: int
    monthly_revenue: float


class RegistrationPoint(BaseModel):
    date: str
    count: int


class RegistrationsResponse(BaseModel):
    points: list[RegistrationPoint]


class DemographicSlice(BaseModel):
    label: str
    count: int


class DemographicsResponse(BaseModel):
    by_gender: list[DemographicSlice]
    by_religion: list[DemographicSlice]
    by_age_group: list[DemographicSlice]


class RevenuePoint(BaseModel):
    date: str
    amount: float


class RevenueResponse(BaseModel):
    points: list[RevenuePoint]
    total: float


class MatchTrendPoint(BaseModel):
    date: str
    count: int


class MatchInsightsResponse(BaseModel):
    by_status: list[DemographicSlice]
    trend: list[MatchTrendPoint]
    total_matches: int
    acceptance_rate: float
