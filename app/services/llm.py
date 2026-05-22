from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Any
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import LlmUsageEvent
from app.schemas import WorkflowTemplatePublic
from app.services.workflow_execution import execute_workflow_template


@dataclass
class LlmExecutionResult:
    result: dict[str, Any]
    usage_event_id: str | None
    provider: str
    model: str
    status: str
    fallback_used: bool


def _sha256_json(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _estimate_tokens(text: str) -> int:
    return max(1, int(len(text) / 4))


def _extract_anthropic_text(payload: dict[str, Any]) -> str:
    parts: list[str] = []
    for item in payload.get("content") or []:
        if isinstance(item, dict) and item.get("type") == "text":
            parts.append(str(item.get("text") or ""))
    return "\n".join(part for part in parts if part).strip()


def _parse_model_json(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.lower().startswith("json"):
            stripped = stripped[4:].strip()
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    return {
        "status": "completed",
        "deliverable": {
            "summary": stripped[:4000],
            "raw_text": stripped,
        },
        "execution_summary": {
            "mode": "llm_text",
            "artifact_kind": "model_generated_text",
            "sections_generated": 1,
        },
    }


def _workflow_prompt(template: WorkflowTemplatePublic, inputs: dict[str, Any]) -> str:
    return (
        "You are ANCAP's paid AI-workflow execution engine.\n"
        "Return ONLY valid JSON. Do not include markdown fences.\n"
        "Do not promise token price, yield, listing approval, or investment returns.\n"
        "The JSON must include: status, workflow_slug, template_title, delivery, deliverable, execution_summary.\n\n"
        f"Workflow slug: {template.slug}\n"
        f"Workflow title: {template.title}\n"
        f"Category: {template.category}\n"
        f"Summary: {template.summary}\n"
        f"Expected output items: {json.dumps(template.output_items, ensure_ascii=False)}\n"
        f"Buyer inputs: {json.dumps(inputs or {}, ensure_ascii=False, sort_keys=True)}\n"
    )


async def _call_teneta_claude(prompt: str) -> tuple[str, dict[str, Any]]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")
    base_url = settings.anthropic_base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        response = await client.post(
            f"{base_url}/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.llm_model,
                "max_tokens": settings.llm_max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        response.raise_for_status()
        payload = response.json()
    return _extract_anthropic_text(payload), payload


async def _call_openai(prompt: str) -> tuple[str, dict[str, Any]]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"authorization": f"Bearer {settings.openai_api_key}", "content-type": "application/json"},
            json={
                "model": settings.llm_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": settings.llm_max_tokens,
            },
        )
        response.raise_for_status()
        payload = response.json()
    text = payload.get("choices", [{}])[0].get("message", {}).get("content") or ""
    return str(text), payload


async def _call_ollama(prompt: str) -> tuple[str, dict[str, Any]]:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        response = await client.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/generate",
            json={"model": settings.llm_model, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        payload = response.json()
    return str(payload.get("response") or ""), payload


async def _store_usage_event(
    session: AsyncSession,
    *,
    owner_user_id: str | UUID | None,
    workflow_run_id: str | UUID | None,
    provider: str,
    model: str,
    prompt: str,
    output_text: str,
    latency_ms: int,
    status: str,
    error: str | None,
    metadata: dict[str, Any],
) -> LlmUsageEvent:
    row = LlmUsageEvent(
        owner_user_id=owner_user_id,
        workflow_run_id=workflow_run_id,
        provider=provider,
        model=model,
        prompt_hash=hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
        input_tokens_estimate=_estimate_tokens(prompt),
        output_tokens_estimate=_estimate_tokens(output_text or ""),
        latency_ms=latency_ms,
        status=status,
        error=(error[:1000] if error else None),
        cost_currency="ACP",
        cost_amount=Decimal("0"),
        metadata_json=metadata,
    )
    session.add(row)
    await session.flush()
    return row


async def execute_paid_workflow_with_llm(
    session: AsyncSession,
    *,
    template: WorkflowTemplatePublic,
    inputs: dict[str, Any] | None,
    owner_user_id: str | UUID | None,
    workflow_run_id: str | UUID | None,
) -> LlmExecutionResult:
    settings = get_settings()
    provider = (settings.llm_provider or "teneta_claude").strip().lower()
    model = settings.llm_model
    prompt = _workflow_prompt(template, inputs or {})
    started = time.perf_counter()
    output_text = ""
    metadata: dict[str, Any] = {"workflow_slug": template.slug, "provider_configured": provider}

    try:
        if provider == "disabled":
            raise RuntimeError("LLM provider disabled")
        if provider == "openai":
            output_text, raw = await _call_openai(prompt)
        elif provider == "ollama":
            output_text, raw = await _call_ollama(prompt)
        else:
            output_text, raw = await _call_teneta_claude(prompt)
        latency_ms = int((time.perf_counter() - started) * 1000)
        result = _parse_model_json(output_text)
        result.setdefault("status", "completed")
        result.setdefault("workflow_slug", template.slug)
        result.setdefault("template_title", template.title)
        result.setdefault("delivery", template.output_items)
        summary = result.setdefault("execution_summary", {})
        if isinstance(summary, dict):
            summary["mode"] = summary.get("mode") or "llm_generated"
            summary["llm_provider"] = provider
            summary["llm_model"] = model
        event = await _store_usage_event(
            session,
            owner_user_id=owner_user_id,
            workflow_run_id=workflow_run_id,
            provider=provider,
            model=model,
            prompt=prompt,
            output_text=output_text,
            latency_ms=latency_ms,
            status="succeeded",
            error=None,
            metadata={"raw_response_hash": _sha256_json(raw), **metadata},
        )
        result["llm_usage"] = {
            "event_id": str(event.id),
            "provider": provider,
            "model": model,
            "status": "succeeded",
        }
        return LlmExecutionResult(result=result, usage_event_id=str(event.id), provider=provider, model=model, status="succeeded", fallback_used=False)
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        fallback = execute_workflow_template(template, inputs or {})
        summary = fallback.setdefault("execution_summary", {})
        if isinstance(summary, dict):
            summary["mode"] = "template_fallback"
            summary["llm_provider"] = provider
            summary["llm_model"] = model
        event = await _store_usage_event(
            session,
            owner_user_id=owner_user_id,
            workflow_run_id=workflow_run_id,
            provider=provider,
            model=model,
            prompt=prompt,
            output_text=json.dumps(fallback, default=str, ensure_ascii=False),
            latency_ms=latency_ms,
            status="fallback" if settings.llm_fallback_to_template else "failed",
            error=str(exc),
            metadata=metadata,
        )
        fallback["llm_usage"] = {
            "event_id": str(event.id),
            "provider": provider,
            "model": model,
            "status": "fallback",
            "error": str(exc)[:240],
        }
        return LlmExecutionResult(result=fallback, usage_event_id=str(event.id), provider=provider, model=model, status="fallback", fallback_used=True)
