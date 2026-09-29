from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import func, select

from app.api.deps import DbSession, get_current_user_id, require_platform_admin
from app.config import get_settings
from app.db.models import (
    ApiUsageEvent,
    LlmUsageEvent,
    MetricRecord as MetricRecordModel,
    PaymentIntent,
    WorkflowRunRecord,
)
from app.schemas import MetricRecordPublic
from app.services.cache import redis_ping
from app.services.observability import render_http_metrics

router = APIRouter(prefix="/metrics", tags=["Metrics"])


async def require_metrics_or_admin(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
    x_metrics_token: str | None = Header(default=None, alias="X-Metrics-Token"),
) -> str:
    settings = get_settings()
    scrape = (settings.metrics_scrape_token or "").strip()
    provided = (x_metrics_token or "").strip()
    if scrape and provided and provided == scrape:
        return "scrape-token"
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return await require_platform_admin(user_id=user_id, session=session)


@router.get("", response_model=dict)
async def list_metrics_for_run(
    session: DbSession,
    run_id: UUID | None = None,
    _auth: str = Depends(require_metrics_or_admin),
):
    if run_id is None:
        workflow_count = (await session.execute(select(func.count(WorkflowRunRecord.id)))).scalar_one()
        captured_count = (
            await session.execute(select(func.count(PaymentIntent.id)).where(PaymentIntent.status == "captured"))
        ).scalar_one()
        paid_api_count = (await session.execute(select(func.count(ApiUsageEvent.id)))).scalar_one()
        llm_succeeded = (
            await session.execute(select(func.count(LlmUsageEvent.id)).where(LlmUsageEvent.status == "succeeded"))
        ).scalar_one()
        llm_fallback = (
            await session.execute(select(func.count(LlmUsageEvent.id)).where(LlmUsageEvent.status == "fallback"))
        ).scalar_one()
        redis_ok, _redis_error = await redis_ping()
        body = "\n".join(
            [
                render_http_metrics(),
                "# HELP ancap_workflow_runs_total Workflow runs recorded.",
                "# TYPE ancap_workflow_runs_total gauge",
                f"ancap_workflow_runs_total {int(workflow_count or 0)}",
                "# HELP ancap_payment_intents_captured_total Captured payment intents.",
                "# TYPE ancap_payment_intents_captured_total gauge",
                f"ancap_payment_intents_captured_total {int(captured_count or 0)}",
                "# HELP ancap_paid_api_usage_events_total Paid API usage events.",
                "# TYPE ancap_paid_api_usage_events_total gauge",
                f"ancap_paid_api_usage_events_total {int(paid_api_count or 0)}",
                "# HELP ancap_llm_usage_events_total LLM usage events by status.",
                "# TYPE ancap_llm_usage_events_total gauge",
                f'ancap_llm_usage_events_total{{status="succeeded"}} {int(llm_succeeded or 0)}',
                f'ancap_llm_usage_events_total{{status="fallback"}} {int(llm_fallback or 0)}',
                "# HELP ancap_redis_up Redis availability.",
                "# TYPE ancap_redis_up gauge",
                f"ancap_redis_up {1 if redis_ok else 0}",
                "",
            ]
        )
        return Response(content=body, media_type="text/plain; version=0.0.4; charset=utf-8")

    q = select(MetricRecordModel).where(MetricRecordModel.run_id == run_id)
    r = await session.execute(q)
    rows = r.scalars().all()
    return {
        "items": [
            MetricRecordPublic(run_id=str(m.run_id), name=m.name, value=m.value)
            for m in rows
        ]
    }
