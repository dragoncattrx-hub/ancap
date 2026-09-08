"""Ownership certificate API — ACP crypto contracts for intangible / title assets."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_auth
from app.schemas.ownership_proofs import (
    OwnershipCatalogPublic,
    OwnershipCertificatePublic,
    OwnershipIssueRequest,
    OwnershipIssueResponse,
    OwnershipTransferRedeemRequest,
)
from app.services import ownership_proofs as own_svc

router = APIRouter(prefix="/ownership-proofs", tags=["Ownership Proofs"])


@router.get("/catalog", response_model=OwnershipCatalogPublic)
def ownership_catalog():
    return own_svc.catalog()


@router.post("/certificates", response_model=OwnershipIssueResponse, status_code=201)
async def issue_certificate(
    body: OwnershipIssueRequest,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    return await own_svc.issue(session, user_id=user_id, body=body)


@router.get("/certificates", response_model=list[OwnershipCertificatePublic])
async def list_certificates(
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    return await own_svc.list_mine(session, user_id=user_id)


@router.get("/certificates/{certificate_id}", response_model=OwnershipCertificatePublic)
async def get_certificate(
    certificate_id: str,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    return await own_svc.get_one(session, user_id=user_id, certificate_id=certificate_id)


@router.post("/transfers/redeem", response_model=OwnershipCertificatePublic)
async def redeem_transfer(
    body: OwnershipTransferRedeemRequest,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    return await own_svc.redeem_transfer(session, user_id=user_id, body=body)


@router.post("/certificates/{certificate_id}/revoke", response_model=OwnershipCertificatePublic)
async def revoke_certificate(
    certificate_id: str,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    return await own_svc.revoke(session, user_id=user_id, certificate_id=certificate_id)
