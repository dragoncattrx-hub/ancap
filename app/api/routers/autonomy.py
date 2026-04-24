from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, require_auth
from app.config import get_settings
from app.services.ledger import is_ledger_invariant_halted, set_ledger_invariant_halted

router = APIRouter(prefix="/autonomy", tags=["Autonomy"])


@router.get("/ops/anomalies")
async def ops_anomalies(session: DbSession):
    halted = await is_ledger_invariant_halted(session)
    items = []
    if halted:
        items.append(
            {
                "id": "ledger-invariant-halted",
                "severity": "high",
                "status": "open",
                "suggested_remediation": "reset_ledger_halt_after_verification",
            }
        )
    return {"items": items, "count": len(items)}


@router.post("/ops/remediations/apply")
async def apply_remediation(body: dict, session: DbSession, _user_id: str = Depends(require_auth)):
    action = str((body or {}).get("action") or "").strip()
    if action == "reset_ledger_halt_after_verification":
        await set_ledger_invariant_halted(session, halted=False)
        return {"ok": True, "action": action}
    raise HTTPException(status_code=400, detail="Unsupported remediation action")


@router.post("/ai-council/recommend")
async def ai_council_recommend(body: dict, _user_id: str = Depends(require_auth)):
    subject = str((body or {}).get("subject") or "").strip()
    evidence = str((body or {}).get("evidence") or "").strip()
    if not subject:
        raise HTTPException(status_code=400, detail="subject is required")
    recommendation = "escalate_manual_review" if "slash" in evidence.lower() or "fraud" in evidence.lower() else "allow_with_monitoring"
    confidence = 0.82 if recommendation == "escalate_manual_review" else 0.67
    return {
        "subject": subject,
        "recommendation": recommendation,
        "confidence": confidence,
        "rationale": "Rule-based council beta output; requires human confirmation.",
    }


@router.post("/strategy-compiler/compile")
async def compile_nl_strategy(body: dict, _user_id: str = Depends(require_auth)):
    settings = get_settings()
    if not settings.ff_nl_strategy_compiler:
        raise HTTPException(status_code=403, detail="NL strategy compiler is disabled")
    prompt = str((body or {}).get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    workflow = {
        "vertical_id": "base",
        "version": "1.0",
        "steps": [
            {"id": "s1", "action": "const", "args": {"value": prompt}, "save_as": "nl_prompt"},
            {"id": "s2", "action": "const", "args": {"value": "dry_run_required"}, "save_as": "guardrail"},
        ],
        "limits": {"max_steps": 50, "max_runtime_ms": 10000},
    }
    return {
        "workflow_json": workflow,
        "validation": {"ok": True, "warnings": ["Generated plan is beta; run dry-run before production."]},
    }

