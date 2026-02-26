"""L3: Self-evolution — auto A/B: flag or promote strategy versions by evaluation score."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Evaluation, StrategyVersion


async def auto_ab_tick(session: AsyncSession, *, min_sample_size: int = 5, promote_percentile: float = 0.9) -> dict:
    """
    For strategies with multiple versions, compare evaluations; optionally mark best for promotion.
    Returns { "checked": N, "promoted": M } (promoted = versions marked as recommended in metadata or similar).
    """
    # Get strategy_version_id -> (score, sample_size) from evaluations
    r = await session.execute(
        select(Evaluation.strategy_version_id, Evaluation.score, Evaluation.sample_size)
    )
    evals = r.all()
    by_strategy: dict = {}
    for sv_id, score, sample_size in evals:
        if (sample_size or 0) < min_sample_size:
            continue
        sv = await session.get(StrategyVersion, sv_id)
        if not sv:
            continue
        sid = str(sv.strategy_id)
        if sid not in by_strategy:
            by_strategy[sid] = []
        by_strategy[sid].append((sv_id, float(score), sample_size))
    checked = 0
    promoted = 0
    for strategy_id, items in by_strategy.items():
        if len(items) < 2:
            continue
        items.sort(key=lambda x: x[1], reverse=True)
        best_sv_id, best_score, best_n = items[0]
        # Mark best version: we could add a column strategy_versions.recommended or use strategy_policy
        # For MVP we just count as "checked"; no DB column change to avoid migration
        checked += 1
        if best_score >= promote_percentile:
            promoted += 1
    return {"checked": checked, "promoted": promoted}
