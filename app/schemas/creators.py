from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class CreatorEarningsWorkflowBreakdownPublic(BaseModel):
    strategy_id: str
    workflow_slug: str
    title: str
    category: str = "uncategorized"
    captured_amount_acp: str = "0"
    order_count: int = 0
    latest_order_at: datetime | None = None


class CreatorEarningsPeriodPublic(BaseModel):
    period_start: date
    earned_acp: str = "0"
    payout_requested_acp: str = "0"
    payout_completed_acp: str = "0"
    completed_orders: int = 0


class CreatorEarningsSummaryPublic(BaseModel):
    generated_at: datetime
    since: datetime
    window_days: int
    total_earnings_acp: str = "0"
    window_earnings_acp: str = "0"
    pending_payout_acp: str = "0"
    paid_out_acp: str = "0"
    active_listing_count: int = 0
    completed_order_count: int = 0
    conversion_rate: float | None = None
    conversion_rate_basis: str = "awaiting_checkout_funnel_instrumentation"
    earnings_by_workflow: list[CreatorEarningsWorkflowBreakdownPublic] = Field(default_factory=list)
    earnings_by_period: list[CreatorEarningsPeriodPublic] = Field(default_factory=list)


class CreatorConversionCountsPublic(BaseModel):
    views: int = 0
    add_to_cart: int = 0
    checkout_started: int = 0
    completed: int = 0


class CreatorConversionCoveragePublic(BaseModel):
    views: bool = False
    add_to_cart: bool = False
    checkout_started: bool = False
    completed: bool = True


class CreatorListingConversionPublic(BaseModel):
    listing_id: str
    strategy_id: str
    title: str
    category: str = "uncategorized"
    counts: CreatorConversionCountsPublic = Field(default_factory=CreatorConversionCountsPublic)


class CreatorConversionPeriodPublic(BaseModel):
    period_start: date
    counts: CreatorConversionCountsPublic = Field(default_factory=CreatorConversionCountsPublic)


class CreatorConversionsSummaryPublic(BaseModel):
    generated_at: datetime
    since: datetime
    window_days: int
    coverage: CreatorConversionCoveragePublic = Field(default_factory=CreatorConversionCoveragePublic)
    totals: CreatorConversionCountsPublic = Field(default_factory=CreatorConversionCountsPublic)
    listings: list[CreatorListingConversionPublic] = Field(default_factory=list)
    periods: list[CreatorConversionPeriodPublic] = Field(default_factory=list)
