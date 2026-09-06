"""Orbital sealed-edge control plane API (R11)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.orbital_edge import (
    OrbitalAttestationCreate,
    OrbitalAttestationPublic,
    OrbitalEdgeStatusPublic,
    OrbitalNodeCreate,
    OrbitalNodePublic,
    OrbitalNodeUpdate,
)
from app.services import orbital_edge as svc

router = APIRouter(tags=["Orbital Edge"])


@router.get("/orbital-edge/status", response_model=OrbitalEdgeStatusPublic)
async def orbital_edge_status(session: DbSession):
    return await svc.edge_status(session)


@router.get("/organizations/{org_id}/orbital-edge/nodes", response_model=list[OrbitalNodePublic])
async def list_nodes(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_nodes(session, org_id=org_id, user_id=user_id)


@router.post(
    "/organizations/{org_id}/orbital-edge/nodes",
    response_model=OrbitalNodePublic,
    status_code=201,
)
async def create_node(
    org_id: str,
    body: OrbitalNodeCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_node(session, org_id=org_id, user_id=user_id, body=body)


@router.patch(
    "/organizations/{org_id}/orbital-edge/nodes/{node_id}",
    response_model=OrbitalNodePublic,
)
async def update_node(
    org_id: str,
    node_id: str,
    body: OrbitalNodeUpdate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.update_node(
        session, org_id=org_id, user_id=user_id, node_id=node_id, body=body
    )


@router.get(
    "/organizations/{org_id}/orbital-edge/nodes/{node_id}/attestations",
    response_model=list[OrbitalAttestationPublic],
)
async def list_attestations(
    org_id: str,
    node_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_attestations(
        session, org_id=org_id, user_id=user_id, node_id=node_id
    )


@router.post(
    "/organizations/{org_id}/orbital-edge/nodes/{node_id}/attestations",
    response_model=OrbitalAttestationPublic,
    status_code=201,
)
async def add_attestation(
    org_id: str,
    node_id: str,
    body: OrbitalAttestationCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.add_attestation(
        session, org_id=org_id, user_id=user_id, node_id=node_id, body=body
    )
