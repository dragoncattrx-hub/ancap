from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.flows import FlowRunRequest, FlowRunResponse
from app.scenarios.runner import run_flow

router = APIRouter(prefix="/flows", tags=["Flows"])


@router.post("/run", response_model=FlowRunResponse)
async def run_flow_endpoint(body: FlowRunRequest, session: DbSession):
    return await run_flow(body.flow_id, session, seed=body.seed, params=body.params)

