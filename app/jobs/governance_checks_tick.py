from sqlalchemy import func, select

from app.db.models import GovernanceProposal, ModerationCase


async def governance_checks_tick(session, commit: bool = False) -> dict:
    """
    Governance moderation checks hook.

    MVP behavior:
    - counts proposals in review state
    - counts open moderation cases
    - returns values so /system/jobs/tick exposes operational visibility
    """
    proposals_in_review = (
        await session.execute(
            select(func.count()).select_from(GovernanceProposal).where(GovernanceProposal.status == "review")
        )
    ).scalar_one()
    open_moderation_cases = (
        await session.execute(
            select(func.count()).select_from(ModerationCase).where(ModerationCase.status == "open")
        )
    ).scalar_one()

    if commit:
        await session.commit()

    return {
        "proposals_in_review": int(proposals_in_review or 0),
        "open_moderation_cases": int(open_moderation_cases or 0),
    }
