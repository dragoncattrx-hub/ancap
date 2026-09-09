"""ACP Insurance HTTP surface (RFC economy/insurance)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import DbSession, require_auth
from app.schemas.insurance import (
    InsuranceCatalogPublic,
    InsuranceClaimCreate,
    InsuranceClaimPublic,
    InsurancePolicyCreate,
    InsurancePolicyPublic,
    InsuranceQuotePublic,
    InsuranceQuoteRequest,
)
from app.services import insurance as svc
from app.services.rate_limit import build_rate_limit_key, enforce_rate_limit, get_request_ip

router = APIRouter(tags=["ACP Insurance"])


async def _ins_rl(request: Request, user_id: str, scope: str) -> None:
    await enforce_rate_limit(
        key=build_rate_limit_key(scope=f"insurance:{scope}", ip=get_request_ip(request), subject=user_id),
        limit=40,
        window_seconds=60,
    )


@router.get("/insurance/catalog", response_model=InsuranceCatalogPublic)
async def insurance_catalog(session: DbSession):
    return await svc.catalog(session)


@router.post("/insurance/quote", response_model=InsuranceQuotePublic)
async def insurance_quote(body: InsuranceQuoteRequest, session: DbSession):
    return await svc.quote(session, body)


@router.post("/insurance/policies", response_model=InsurancePolicyPublic, status_code=201)
async def insurance_create_policy(
    body: InsurancePolicyCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await _ins_rl(request, user_id, "policy")
    return await svc.create_policy(session, user_id=user_id, body=body)


@router.get("/insurance/policies", response_model=list[InsurancePolicyPublic])
async def insurance_list_policies(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_my_policies(session, user_id=user_id)


@router.get("/insurance/policies/{policy_id}", response_model=InsurancePolicyPublic)
async def insurance_get_policy(
    policy_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.get_policy(session, user_id=user_id, policy_id=policy_id)


@router.get("/insurance/pools/{pool_id}")
async def insurance_get_pool(pool_id: str, session: DbSession):
    return await svc.get_pool(session, pool_id)


@router.post(
    "/insurance/policies/{policy_id}/claims",
    response_model=InsuranceClaimPublic,
    status_code=201,
)
async def insurance_file_claim(
    policy_id: str,
    body: InsuranceClaimCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await _ins_rl(request, user_id, "claim")
    return await svc.file_claim(session, user_id=user_id, policy_id=policy_id, body=body)
