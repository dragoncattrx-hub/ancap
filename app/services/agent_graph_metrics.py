"""Agent graph metrics (ROADMAP 2.1): reciprocity_score, cluster_cohesion, suspicious_density, cluster_size, in_cycle from agent_relationships."""
import math
from collections import deque
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AgentRelationship


async def _load_order_edges(session: AsyncSession, relation_type: str = "order") -> list[tuple[UUID, UUID]]:
    """Load all (source, target) edges for relation_type. For clustering we need full graph."""
    q = select(
        AgentRelationship.source_agent_id,
        AgentRelationship.target_agent_id,
    ).where(AgentRelationship.relation_type == relation_type)
    r = await session.execute(q)
    return [(row[0], row[1]) for row in r.all()]


async def get_cluster_size(session: AsyncSession, agent_id: UUID, relation_type: str = "order") -> int:
    """
    Size of connected component containing agent_id (undirected view of order edges).
    BFS: start from agent_id, expand via any edge (source,target) or (target,source).
    """
    edges = await _load_order_edges(session, relation_type)
    if not edges:
        return 1
    # Undirected adjacency: for each (a,b) add b to adj[a] and a to adj[b]
    adj: dict[UUID, set[UUID]] = {}
    for a, b in edges:
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)
    component = {agent_id}
    q = deque([agent_id])
    while q:
        u = q.popleft()
        for v in adj.get(u, set()):
            if v not in component:
                component.add(v)
                q.append(v)
    return len(component)


async def has_cycle(session: AsyncSession, agent_id: UUID, relation_type: str = "order") -> bool:
    """
    True if agent_id lies on a directed cycle (path from agent_id back to agent_id, length >= 1).
    DFS from agent_id following source->target edges; if we reach agent_id again, cycle.
    """
    edges = await _load_order_edges(session, relation_type)
    out_edges: dict[UUID, list[UUID]] = {}
    for a, b in edges:
        out_edges.setdefault(a, []).append(b)
    visited: set[UUID] = set()

    def dfs(node: UUID) -> bool:
        for v in out_edges.get(node, []):
            if v == agent_id:
                return True
            if v in visited:
                continue
            visited.add(v)
            if dfs(v):
                return True
        return False

    return dfs(agent_id)


async def _get_ego_neighbors(
    session: AsyncSession,
    agent_id: UUID,
    relation_type: str = "order",
) -> set:
    """Set of agent IDs in 1-hop neighborhood (including agent_id)."""
    q = select(
        AgentRelationship.source_agent_id,
        AgentRelationship.target_agent_id,
    ).where(
        AgentRelationship.relation_type == relation_type,
        (AgentRelationship.source_agent_id == agent_id) | (AgentRelationship.target_agent_id == agent_id),
    )
    r = await session.execute(q)
    ego = {agent_id}
    for row in r.all():
        ego.add(row[0])
        ego.add(row[1])
    return ego


async def get_cluster_cohesion(
    session: AsyncSession,
    agent_id: UUID,
    relation_type: str = "order",
) -> tuple[float, int]:
    """
    Cohesion of 1-hop ego graph: edges within ego / possible directed edges.
    ego = agent + all neighbors (order edges). Possible = n*(n-1). Return (cohesion in [0,1], ego_size).
    """
    ego = await _get_ego_neighbors(session, agent_id, relation_type)
    n = len(ego)
    if n <= 1:
        return (0.0, n)
    possible = n * (n - 1)
    ego_list = list(ego)
    q = select(func.count(AgentRelationship.id)).where(
        AgentRelationship.relation_type == relation_type,
        AgentRelationship.source_agent_id.in_(ego_list),
        AgentRelationship.target_agent_id.in_(ego_list),
    )
    r = await session.execute(q)
    edges_within = r.scalar() or 0
    cohesion = max(0.0, min(1.0, float(edges_within) / possible))
    return (cohesion, n)


async def get_suspicious_density(
    session: AsyncSession,
    agent_id: UUID,
    relation_type: str = "order",
) -> float:
    """
    Anti-sybil signal: high when ego is small and tightly connected (cluster_cohesion high).
    suspicious_density = cluster_cohesion * (1 / (1 + log2(max(2, size)))). In [0, 1].
    """
    cohesion, n = await get_cluster_cohesion(session, agent_id, relation_type)
    if n <= 1:
        return 0.0
    decay = 1.0 / (1.0 + math.log2(max(2, n)))
    return max(0.0, min(1.0, cohesion * decay))


async def get_reciprocity_score(
    session: AsyncSession,
    agent_id: UUID,
    relation_type: str = "order",
) -> float:
    """
    Reciprocity for one agent: ratio of mutually balanced order volume to total outbound.
    For each partner B: fwd = sum(weight) A->B, back = sum(weight) B->A;
    reciprocity_amt += min(fwd, back); total_fwd += fwd.
    Return reciprocity_amt / total_fwd in [0, 1], or 0 if no edges.
    """
    # Outbound: (target, sum(weight)) where source = agent_id
    q_out = (
        select(
            AgentRelationship.target_agent_id,
            func.coalesce(func.sum(AgentRelationship.weight), 0).label("w"),
        )
        .where(
            AgentRelationship.source_agent_id == agent_id,
            AgentRelationship.relation_type == relation_type,
        )
        .group_by(AgentRelationship.target_agent_id)
    )
    r_out = await session.execute(q_out)
    out_map = {str(row[0]): float(row[1] or 0) for row in r_out.all()}
    if not out_map:
        return 0.0

    partner_ids = list(out_map.keys())
    try:
        partner_uuids = [UUID(p) for p in partner_ids]
    except (ValueError, TypeError):
        return 0.0

    # Inbound: (source, sum(weight)) where target = agent_id and source in partners
    q_in = (
        select(
            AgentRelationship.source_agent_id,
            func.coalesce(func.sum(AgentRelationship.weight), 0).label("w"),
        )
        .where(
            AgentRelationship.target_agent_id == agent_id,
            AgentRelationship.relation_type == relation_type,
            AgentRelationship.source_agent_id.in_(partner_uuids),
        )
        .group_by(AgentRelationship.source_agent_id)
    )
    r_in = await session.execute(q_in)
    in_map = {str(row[0]): float(row[1] or 0) for row in r_in.all()}

    reciprocity_amt = 0.0
    total_fwd = 0.0
    for pid, fwd in out_map.items():
        total_fwd += fwd
        back = in_map.get(pid, 0.0)
        reciprocity_amt += min(fwd, back)
    if total_fwd <= 0:
        return 0.0
    return max(0.0, min(1.0, reciprocity_amt / total_fwd))


async def get_agent_graph_metrics(
    session: AsyncSession,
    agent_id: UUID,
) -> dict:
    """Return graph metrics for an agent (ROADMAP 2.1): reciprocity, cohesion, suspicious_density, cluster_size, in_cycle."""
    reciprocity_score = await get_reciprocity_score(session, agent_id)
    cohesion, ego_size = await get_cluster_cohesion(session, agent_id)
    suspicious = 0.0
    if ego_size > 1:
        decay = 1.0 / (1.0 + math.log2(max(2, ego_size)))
        suspicious = max(0.0, min(1.0, cohesion * decay))
    cluster_size = await get_cluster_size(session, agent_id)
    in_cycle = await has_cycle(session, agent_id)
    return {
        "reciprocity_score": round(reciprocity_score, 4),
        "cluster_cohesion": round(cohesion, 4),
        "suspicious_density": round(suspicious, 4),
        "cluster_size": cluster_size,
        "in_cycle": in_cycle,
    }
