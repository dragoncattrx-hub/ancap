"""AETERNA longevity marketplace API (R12)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.aeterna import (
    AeternaDnaVaultCreate,
    AeternaDnaVaultPublic,
    AeternaIntentOrderCreate,
    AeternaIntentOrderPublic,
    AeternaPartnerCreate,
    AeternaPartnerPublic,
    AeternaStatusPublic,
)
from app.services import aeterna as svc

router = APIRouter(tags=["AETERNA"])


@router.get("/aeterna/status", response_model=AeternaStatusPublic)
async def aeterna_status(session: DbSession):
    return await svc.division_status(session)


@router.post("/aeterna/vault", response_model=AeternaDnaVaultPublic, status_code=201)
async def create_vault(
    body: AeternaDnaVaultCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_vault_entry(session, user_id=user_id, body=body)


@router.get("/aeterna/vault", response_model=list[AeternaDnaVaultPublic])
async def list_vault(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_vault_entries(session, user_id=user_id)


@router.post("/aeterna/intents", response_model=AeternaIntentOrderPublic, status_code=201)
async def create_intent(
    body: AeternaIntentOrderCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_intent_order(session, user_id=user_id, body=body)


@router.get("/aeterna/intents", response_model=list[AeternaIntentOrderPublic])
async def list_intents(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_intent_orders(session, user_id=user_id)


@router.get("/organizations/{org_id}/aeterna/summary", response_model=AeternaStatusPublic)
async def org_aeterna_summary(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.org_summary(session, org_id=org_id, user_id=user_id)


@router.post(
    "/organizations/{org_id}/aeterna/partners",
    response_model=AeternaPartnerPublic,
    status_code=201,
)
async def create_partner(
    org_id: str,
    body: AeternaPartnerCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_partner(session, org_id=org_id, user_id=user_id, body=body)


@router.get("/organizations/{org_id}/aeterna/partners", response_model=list[AeternaPartnerPublic])
async def list_partners(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_partners(session, org_id=org_id, user_id=user_id)


@router.post(
    "/organizations/{org_id}/aeterna/vault",
    response_model=AeternaDnaVaultPublic,
    status_code=201,
)
async def org_create_vault(
    org_id: str,
    body: AeternaDnaVaultCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_vault_entry(session, user_id=user_id, body=body, org_id=org_id)


@router.get("/organizations/{org_id}/aeterna/vault", response_model=list[AeternaDnaVaultPublic])
async def org_list_vault(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_vault_entries(session, user_id=user_id, org_id=org_id)
