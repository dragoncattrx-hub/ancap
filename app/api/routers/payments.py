from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.deps import DbSession, require_auth
from app.api.routers.workflow_store import _capture_credit_top_up_intent, _package_for_top_up_intent, _serialize_payment_intent
from app.config import get_settings
from app.db.models import PaymentIntent, PaymentIntentStatusEnum, StripeEvent
from app.schemas import (
    PaymentMethodsResponse,
    StripeIntentCreateRequest,
    StripeIntentCreateResponse,
    StripeWebhookAck,
    WorkflowCreditTopUpIntentConfirmRequest,
    WorkflowCreditTopUpIntentResponse,
)
from app.services import stripe_payments
from app.services.idempotency import get_idempotency_hit, store_idempotency_result

router = APIRouter(tags=["Payments"])


@router.post("/payments/stripe/intent", response_model=StripeIntentCreateResponse, status_code=201)
async def create_stripe_payment_intent(
    body: StripeIntentCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    idempotency_scope = "payments.create_stripe_intent"
    request_payload = {"user_id": user_id, **body.model_dump()}
    if idempotency_key:
        hit = await get_idempotency_hit(
            session,
            scope=idempotency_scope,
            key=idempotency_key,
            request_payload=request_payload,
        )
        if hit:
            return JSONResponse(status_code=200, content=hit.response_json)

    user = await stripe_payments.get_user_or_404(session, user_id)
    intent, package, stripe_session = await stripe_payments.create_stripe_credit_topup_intent(session, user, body)
    response = StripeIntentCreateResponse(
        item=_serialize_payment_intent(intent),
        package=package,
        stripe=stripe_session,
    )

    if idempotency_key:
        await store_idempotency_result(
            session,
            scope=idempotency_scope,
            key=idempotency_key,
            request_payload=request_payload,
            status_code=201,
            response_json=response.model_dump(),
        )

    return response


@router.get("/payments/methods", response_model=PaymentMethodsResponse)
async def list_payment_methods(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    user = await stripe_payments.get_user_or_404(session, user_id)
    return await stripe_payments.list_stripe_payment_methods_for_user(session, user)


@router.delete("/payments/methods/{payment_method_id}", status_code=204)
async def delete_payment_method(
    payment_method_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    user = await stripe_payments.get_user_or_404(session, user_id)
    await stripe_payments.detach_stripe_payment_method_for_user(session, user, payment_method_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


async def _get_owned_payment_intent(session: DbSession, user_id: str, intent_id: str) -> PaymentIntent:
    try:
        parsed_user_id = UUID(user_id)
        parsed_intent_id = UUID(intent_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Payment intent not found") from exc

    intent = (
        await session.execute(
            select(PaymentIntent)
            .where(
                PaymentIntent.id == parsed_intent_id,
                PaymentIntent.owner_user_id == parsed_user_id,
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    if intent is None:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    return intent


@router.get("/payments/stripe/intents/{intent_id}", response_model=WorkflowCreditTopUpIntentResponse)
async def get_stripe_payment_intent(
    intent_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    intent = await _get_owned_payment_intent(session, user_id, intent_id)
    if intent.intent_type != "credit_topup" or intent.payment_method != "stripe":
        raise HTTPException(status_code=404, detail="Payment intent not found")

    provider_payload = dict(intent.provider_payload_json or {})
    stripe_payment_intent_id = str(intent.stripe_payment_intent_id or "").strip()
    if (
        stripe_payment_intent_id
        and intent.status == PaymentIntentStatusEnum.requires_payment.value
        and stripe_payments.stripe_is_configured()
    ):
        stripe_snapshot = await stripe_payments.fetch_stripe_payment_intent(stripe_payment_intent_id)
        stripe_status = str(stripe_snapshot.get("status") or "").strip()
        latest_payment_method = stripe_snapshot.get("payment_method")
        payment_method_types = [str(item) for item in (stripe_snapshot.get("payment_method_types") or [])]
        provider_payload.update(
            {
                "stripe_status": stripe_status or provider_payload.get("stripe_status") or "requires_payment_method",
                "payment_method_types": payment_method_types or provider_payload.get("payment_method_types") or [],
            }
        )
        if latest_payment_method:
            provider_payload["payment_method_id"] = str(latest_payment_method)
        provider_payload["stripe_last_polled_at"] = datetime.now(UTC).isoformat()
        intent.provider_payload_json = provider_payload
        intent.updated_at = datetime.now(UTC)
        await session.flush()

        if stripe_status == "succeeded":
            await _handle_payment_intent_succeeded(
                session,
                intent,
                stripe_payment_intent_id,
                stripe_status,
                "stripe:poll",
            )
            await session.flush()
        elif stripe_status == "canceled":
            await _handle_payment_intent_terminal_update(
                intent,
                new_status=PaymentIntentStatusEnum.cancelled.value,
                stripe_status=stripe_status,
                event_id="stripe:poll",
                event_type="payment_intent.canceled",
            )
            await session.flush()
        elif stripe_status == "requires_payment_method":
            intent.payment_reference = f"stripe:{stripe_payment_intent_id}"
            await session.flush()

    package = _package_for_top_up_intent(intent)
    return WorkflowCreditTopUpIntentResponse(
        item=_serialize_payment_intent(intent),
        package=package,
        credited=intent.status == PaymentIntentStatusEnum.captured.value,
    )


async def _get_stripe_event_by_provider_id(session: DbSession, stripe_event_id: str) -> StripeEvent | None:
    return (
        await session.execute(
            select(StripeEvent).where(StripeEvent.stripe_event_id == stripe_event_id).limit(1)
        )
    ).scalar_one_or_none()


async def _get_payment_intent_by_stripe_id(session: DbSession, stripe_payment_intent_id: str) -> PaymentIntent | None:
    return (
        await session.execute(
            select(PaymentIntent)
            .where(PaymentIntent.stripe_payment_intent_id == stripe_payment_intent_id)
            .limit(1)
        )
    ).scalar_one_or_none()


def _merge_provider_payload(intent: PaymentIntent, **values: object) -> None:
    payload = dict(intent.provider_payload_json or {})
    payload.update({key: value for key, value in values.items() if value is not None})
    intent.provider_payload_json = payload
    intent.updated_at = datetime.now(UTC)


async def _handle_payment_intent_succeeded(
    session: DbSession,
    intent: PaymentIntent,
    stripe_payment_intent_id: str,
    stripe_status: str,
    event_id: str,
) -> bool:
    _merge_provider_payload(
        intent,
        stripe_status=stripe_status,
        stripe_last_event_id=event_id,
        stripe_last_event_type="payment_intent.succeeded",
        stripe_last_event_at=datetime.now(UTC).isoformat(),
    )
    intent.payment_reference = f"stripe:{stripe_payment_intent_id}"

    if intent.intent_type != "credit_topup":
        return False
    if intent.status == PaymentIntentStatusEnum.captured.value and intent.capture_ledger_event_id:
        return True

    package = _package_for_top_up_intent(intent)
    await _capture_credit_top_up_intent(
        session,
        intent,
        package,
        WorkflowCreditTopUpIntentConfirmRequest(
            payment_reference=f"stripe:{stripe_payment_intent_id}",
            note="Stripe webhook payment confirmation",
        ),
        approved_by_user_id=None,
    )
    return True


async def _handle_payment_intent_terminal_update(
    intent: PaymentIntent,
    *,
    new_status: str,
    stripe_status: str,
    event_id: str,
    event_type: str,
) -> bool:
    _merge_provider_payload(
        intent,
        stripe_status=stripe_status,
        stripe_last_event_id=event_id,
        stripe_last_event_type=event_type,
        stripe_last_event_at=datetime.now(UTC).isoformat(),
    )
    if intent.status == PaymentIntentStatusEnum.requires_payment.value:
        intent.status = new_status
        return True
    return False


@router.post("/webhooks/stripe", response_model=StripeWebhookAck)
async def stripe_webhook(
    request: Request,
    session: DbSession,
):
    settings = get_settings()
    webhook_secret = (settings.stripe_webhook_secret or "").strip()
    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook secret is not configured",
        )

    payload = await request.body()
    event = stripe_payments.parse_stripe_webhook_event(
        payload,
        request.headers.get("Stripe-Signature"),
        webhook_secret,
    )

    event_id = str(event.get("id") or "").strip()
    event_type = str(event.get("type") or "").strip()
    if not event_id or not event_type:
        raise HTTPException(status_code=400, detail="Stripe webhook payload is missing id or type")

    existing = await _get_stripe_event_by_provider_id(session, event_id)
    if existing is not None:
        return StripeWebhookAck(
            received=True,
            duplicate=True,
            processed=bool(existing.processed),
            event_id=existing.stripe_event_id,
            event_type=existing.event_type,
        )

    event_row = StripeEvent(
        stripe_event_id=event_id,
        event_type=event_type,
        processed=False,
        payload_json=event,
    )
    session.add(event_row)
    await session.flush()

    handled = False
    data_object = ((event.get("data") or {}).get("object") or {}) if isinstance(event.get("data"), dict) else {}
    stripe_payment_intent_id = str(data_object.get("id") or "").strip()
    stripe_status = str(data_object.get("status") or "").strip() or event_type

    if stripe_payment_intent_id:
        intent = await _get_payment_intent_by_stripe_id(session, stripe_payment_intent_id)
        if intent is not None:
            if event_type == "payment_intent.succeeded":
                handled = await _handle_payment_intent_succeeded(
                    session,
                    intent,
                    stripe_payment_intent_id,
                    stripe_status,
                    event_id,
                )
            elif event_type == "payment_intent.payment_failed":
                handled = await _handle_payment_intent_terminal_update(
                    intent,
                    new_status=PaymentIntentStatusEnum.failed.value,
                    stripe_status=stripe_status,
                    event_id=event_id,
                    event_type=event_type,
                )
            elif event_type == "payment_intent.canceled":
                handled = await _handle_payment_intent_terminal_update(
                    intent,
                    new_status=PaymentIntentStatusEnum.cancelled.value,
                    stripe_status=stripe_status,
                    event_id=event_id,
                    event_type=event_type,
                )

    event_row.processed = True
    event_row.processed_at = datetime.now(UTC)
    await session.flush()

    return StripeWebhookAck(
        received=True,
        duplicate=False,
        processed=handled,
        event_id=event_id,
        event_type=event_type,
    )
