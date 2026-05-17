from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from app.schemas import Money, WorkflowBundlePublic, WorkflowCreditPackagePublic, WorkflowTemplatePublic


WORKFLOW_TEMPLATES: list[WorkflowTemplatePublic] = [
    WorkflowTemplatePublic(
        slug="token-listing-pack",
        title="Token Listing Pack",
        category="Launch",
        summary="Generate reusable listing answers for exchanges, token pages, and directories.",
        description="Creates short and long project copy, listing form answers, and exchange-friendly token descriptions.",
        price=Money(amount="10", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        estimated_time_minutes=20,
        preview_items=["Short project summary", "Listing answer preview", "Output structure"],
        output_items=["Token bio", "Project description", "Listing answers", "Receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "status_timeline"],
        tags=["listing", "launch", "token"],
    ),
    WorkflowTemplatePublic(
        slug="crypto-campaign-builder",
        title="Crypto Campaign Builder",
        category="Marketing",
        summary="Build a launch or growth plan for Telegram, X, community actions, and referral loops.",
        description="Creates a structured 7/14/30-day campaign plan with messaging, actions, and execution checklist.",
        price=Money(amount="19", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        estimated_time_minutes=30,
        preview_items=["Campaign skeleton", "Channel mix", "Execution phases"],
        output_items=["Campaign plan", "Post ideas", "Contest mechanics", "Receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "proof_metadata"],
        tags=["marketing", "growth", "campaign"],
    ),
    WorkflowTemplatePublic(
        slug="telegram-growth-kit",
        title="Telegram Growth Kit",
        category="Community",
        summary="Design a Telegram operating kit with rules, posting flow, onboarding, and moderation guidance.",
        description="Produces a practical operating pack for crypto communities that want cleaner growth and moderation structure.",
        price=Money(amount="12", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        estimated_time_minutes=25,
        preview_items=["Rule set preview", "Welcome flow preview", "Ops structure"],
        output_items=["Rules", "Welcome flow", "Moderator checklist", "Receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "template_version", "completion_receipt"],
        tags=["telegram", "community", "moderation"],
    ),
    WorkflowTemplatePublic(
        slug="airdrop-bounty-builder",
        title="Airdrop / Bounty Builder",
        category="Campaigns",
        summary="Create tasks, reward logic, anti-sybil rules, and proof policy for bounty campaigns.",
        description="Helps teams structure incentive campaigns without turning them into low-quality spam farms.",
        price=Money(amount="15", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        estimated_time_minutes=30,
        preview_items=["Task structure", "Reward logic", "Verification outline"],
        output_items=["Task matrix", "Reward table", "Proof policy", "Receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "verification_policy"],
        tags=["bounty", "airdrop", "campaign"],
    ),
    WorkflowTemplatePublic(
        slug="token-risk-report",
        title="Token Risk Report",
        category="Risk",
        summary="Produce a structured risk and trust snapshot for a token, wallet cluster, or liquidity setup.",
        description="Summarizes concentration, liquidity, trust signals, and operational flags into a usable risk report shell.",
        price=Money(amount="14", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        estimated_time_minutes=20,
        preview_items=["Risk summary", "Trust notes", "Flag categories"],
        output_items=["Risk snapshot", "Trust signals", "Operational flags", "Receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "asset_reference", "status_timeline"],
        tags=["risk", "token", "intelligence"],
    ),
]


WORKFLOW_BUNDLES: list[WorkflowBundlePublic] = [
    WorkflowBundlePublic(
        slug="launch-pack",
        title="ANCAP Crypto Launch Pack",
        category="Launch Suite",
        summary="Five paid crypto launch workflows sold together as a higher-ticket execution bundle.",
        description="Creates listing copy, launch campaign plan, Telegram operating kit, bounty structure, and token risk snapshot in one checkout.",
        workflow_slugs=[
            "token-listing-pack",
            "crypto-campaign-builder",
            "telegram-growth-kit",
            "airdrop-bounty-builder",
            "token-risk-report",
        ],
        price=Money(amount="49", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        discount_percent=30,
        estimated_time_minutes=125,
        output_items=[
            "Listing pack",
            "Campaign plan",
            "Telegram growth kit",
            "Airdrop / bounty structure",
            "Token risk report",
            "Five proof-backed workflow receipts",
        ],
        tags=["bundle", "launch", "growth", "risk"],
    ),
    WorkflowBundlePublic(
        slug="growth-pack",
        title="ANCAP Growth Pack",
        category="Growth Suite",
        summary="Repeatable campaign and community workflows for teams that iterate every week.",
        description="Creates two campaign plans, two Telegram operating passes, and one bounty structure for recurring growth execution.",
        workflow_slugs=[
            "crypto-campaign-builder",
            "telegram-growth-kit",
            "airdrop-bounty-builder",
            "crypto-campaign-builder",
            "telegram-growth-kit",
        ],
        price=Money(amount="59", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        discount_percent=23,
        estimated_time_minutes=140,
        output_items=[
            "Two campaign plans",
            "Two Telegram growth passes",
            "Bounty task matrix",
            "Five proof-backed workflow receipts",
        ],
        tags=["bundle", "growth", "community", "campaign"],
    ),
    WorkflowBundlePublic(
        slug="concierge-pack",
        title="ANCAP Concierge Pack",
        category="Concierge",
        summary="A premium bundle for teams that want generated artifacts plus operator review.",
        description="Creates all five launch workflows and prices the run as a concierge engagement with room for manual review and delivery polish.",
        workflow_slugs=[
            "token-listing-pack",
            "crypto-campaign-builder",
            "telegram-growth-kit",
            "airdrop-bounty-builder",
            "token-risk-report",
        ],
        price=Money(amount="149", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        discount_percent=0,
        estimated_time_minutes=180,
        output_items=[
            "Full launch workflow set",
            "Premium review budget",
            "Custom delivery polish",
            "Five proof-backed workflow receipts",
        ],
        tags=["bundle", "concierge", "premium", "launch"],
    ),
]


WORKFLOW_CREDIT_PACKAGES: list[WorkflowCreditPackagePublic] = [
    WorkflowCreditPackagePublic(
        slug="starter-credits",
        title="Starter Credits",
        description="Enough balance to run one launch workflow or test the paid execution loop.",
        price=Money(amount="25", currency="USDC"),
        credit_amount=Money(amount="25", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        bonus_percent=0,
        recommended_for=["first paid workflow", "proof bundle test"],
    ),
    WorkflowCreditPackagePublic(
        slug="launch-credits",
        title="Launch Credits",
        description="Best fit for the Launch Pack plus one or two follow-up reruns.",
        price=Money(amount="95", currency="USDC"),
        credit_amount=Money(amount="100", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        bonus_percent=5,
        recommended_for=["launch pack", "campaign iteration"],
    ),
    WorkflowCreditPackagePublic(
        slug="growth-credits",
        title="Growth Credits",
        description="A larger balance for repeated launch, growth, and risk workflows.",
        price=Money(amount="225", currency="USDC"),
        credit_amount=Money(amount="250", currency="USDC"),
        accepted_currencies=["USDC", "wACP", "ACP"],
        bonus_percent=11,
        recommended_for=["teams", "multiple assets", "repeat campaigns"],
    ),
]


def find_workflow_template(workflow_slug: str) -> WorkflowTemplatePublic | None:
    return next((item for item in WORKFLOW_TEMPLATES if item.slug == workflow_slug), None)


def find_workflow_bundle(bundle_slug: str) -> WorkflowBundlePublic | None:
    return next((item for item in WORKFLOW_BUNDLES if item.slug == bundle_slug), None)


def find_credit_package(package_slug: str) -> WorkflowCreditPackagePublic | None:
    return next((item for item in WORKFLOW_CREDIT_PACKAGES if item.slug == package_slug), None)



def quote_workflow_amount(template: WorkflowTemplatePublic, payment_currency: str) -> Decimal:
    quoted_amount = Decimal(template.price.amount)
    if payment_currency == "wACP":
        return (quoted_amount * Decimal("0.9")).quantize(Decimal("0.01"))
    if payment_currency == "ACP":
        return (quoted_amount * Decimal("1.0")).quantize(Decimal("0.01"))
    return quoted_amount.quantize(Decimal("0.01"))


def quote_bundle_amount(bundle: WorkflowBundlePublic, payment_currency: str) -> Decimal:
    quoted_amount = Decimal(bundle.price.amount)
    if payment_currency == "wACP":
        return (quoted_amount * Decimal("0.9")).quantize(Decimal("0.01"))
    if payment_currency == "ACP":
        return (quoted_amount * Decimal("1.0")).quantize(Decimal("0.01"))
    return quoted_amount.quantize(Decimal("0.01"))


def quote_credit_package_amount(package: WorkflowCreditPackagePublic, payment_currency: str) -> Decimal:
    quoted_amount = Decimal(package.price.amount)
    if payment_currency == "wACP":
        return (quoted_amount * Decimal("0.9")).quantize(Decimal("0.01"))
    if payment_currency == "ACP":
        return quoted_amount.quantize(Decimal("0.01"))
    return quoted_amount.quantize(Decimal("0.01"))



def build_workflow_preview(template: WorkflowTemplatePublic) -> dict[str, Any]:
    return {
        "headline": f"Preview for {template.title}",
        "included": template.preview_items,
        "note": "Persistent workflow run created. Payment confirmation and execution are tracked separately.",
    }



def build_workflow_result_shell(template: WorkflowTemplatePublic) -> dict[str, Any]:
    return {
        "status": "preview_ready",
        "sections": template.output_items,
    }



def execute_workflow_template(template: WorkflowTemplatePublic, inputs: dict[str, Any] | None) -> dict[str, Any]:
    payload = inputs or {}
    project_name = str(payload.get("project_name") or payload.get("project") or "Your project")
    audience = str(payload.get("audience") or "crypto users")
    goals = payload.get("goals") if isinstance(payload.get("goals"), list) else []
    channels = payload.get("channels") if isinstance(payload.get("channels"), list) else []
    token_symbol = str(payload.get("token_symbol") or payload.get("symbol") or "TOKEN")
     
    primary_cta = str(payload.get("primary_cta") or "Book a call / request a workflow")
    posting_style = str(payload.get("posting_style") or "direct, proof-driven, anti-hype")
    reward_budget = str(payload.get("reward_budget") or "to be defined")
    market = str(payload.get("market") or payload.get("region") or "global crypto market")
    competitors = payload.get("competitors") if isinstance(payload.get("competitors"), list) else []
    constraints = payload.get("constraints") if isinstance(payload.get("constraints"), list) else []
    token_type = str(payload.get("token_type") or "utility token")
    chain = str(payload.get("chain") or payload.get("network") or "EVM")
    liquidity_model = str(payload.get("liquidity_model") or "DEX-led liquidity")
    geography = str(payload.get("geography") or payload.get("region") or "global")

    generated_at = datetime.now(UTC).isoformat()
    deliverable: dict[str, Any]
    execution_summary: dict[str, Any]

    if template.slug == "token-listing-pack":
        deliverable = {
            "positioning_summary": {
                "project": project_name,
                "token_symbol": token_symbol,
                "token_type": token_type,
                "chain": chain,
                "audience": audience,
                "market": market,
            },
            "listing_copy": {
                "short": f"{project_name} is a {chain}-based crypto platform building execution-ready tooling for {audience}.",
                "medium": f"{project_name} uses {token_symbol} as a {token_type} to coordinate access, incentives, or operations across {audience} in the {market}.",
                "long": f"{project_name} is positioned as a practical crypto product for {audience}, focused on execution instead of abstraction. {token_symbol} supports the platform as a {token_type} on {chain}, while the broader offer is packaged for cleaner exchange, directory, and partner submissions.",
            },
            "exchange_form_answers": {
                "what_is_project": f"{project_name} is a crypto-focused platform built for {audience}.",
                "problem": f"Teams in the {market} need reusable listing-ready messaging instead of rewriting answers every time.",
                "solution": f"{project_name} packages execution-focused tooling and service flows instead of vague AI/Web3 positioning.",
                "token_utility": f"{token_symbol} functions as a {token_type} aligned with platform access, incentives, and operational usage.",
                "target_users": audience,
                "network": chain,
                "liquidity_model": liquidity_model,
            },
            "token_utility_bullets": [
                f"{token_symbol} is framed as a {token_type}, not a passive promise asset",
                "Utility messaging is aligned with product access and execution flows",
                "Listing language avoids yield/investment claims and stays product-centric",
            ],
            "due_diligence_checklist": [
                "Prepare token/logo asset pack",
                "Verify website, docs, socials, and token messaging are consistent",
                "Document token utility clearly and avoid financial-promise language",
                "Prepare founder/team/contact answers for listing reviewers",
                "Reuse approved answers across exchanges/directories with version control",
            ],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "listing_pack",
            "sections_generated": 5,
            "focus": ["exchange forms", "directory copy", "token positioning", "due diligence"],
        }
    elif template.slug == "crypto-campaign-builder":
        deliverable = {
            "campaign_thesis": f"Grow {project_name} with direct, conversion-oriented messaging for {audience}.",
            "offer_stack": {
                "core_offer": f"{project_name} should be sold as an execution-ready crypto product, not abstract infrastructure.",
                "primary_cta": primary_cta,
                "positioning_rule": "Lead with outcomes, proof, and clear buyer fit.",
            },
            "channel_mix": channels or ["Telegram", "X", "Landing page", "Partner communities"],
            "30_day_plan": {
                "week_1": ["clarify offer", "ship landing copy", "define primary CTA"],
                "week_2": ["launch content rhythm", "seed partner mentions", "collect objections"],
                "week_3": ["test hooks and CTAs", "refine response scripts", "push best-performing angle"],
                "week_4": ["double down on winning channel", "publish proof/results", "convert warm leads"],
            },
            "content_calendar": {
                "telegram": ["operator update", "case/proof post", "CTA post"],
                "x": ["hook thread", "proof snippet", "offer reiteration"],
                "landing_page": ["headline test", "proof block", "CTA refinement"],
            },
            "post_angles": [
                f"Why {project_name} matters for {audience}",
                "Outcome-driven offer instead of tech abstraction",
                "Operational proof and before/after examples",
            ],
            "response_scripts": {
                "warm_inbound": "Send short offer summary, proof point, and CTA to continue.",
                "skeptical_reply": "Acknowledge objection, show concrete proof, and restate buyer fit.",
                "partner_outreach": "Lead with audience overlap and clear mutual upside.",
            },
            "goals": goals or ["Increase qualified inbound", "Improve campaign clarity", "Raise conversion intent"],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "campaign_plan",
            "sections_generated": 6,
            "focus": channels or ["Telegram", "X", "Landing page"],
        }
    elif template.slug == "telegram-growth-kit":
        deliverable = {
            "community_positioning": f"{project_name} Telegram should feel operational, trustworthy, and anti-spam.",
            "rules": [
                "No fake support or wallet-drain links",
                "No repetitive bounty spam",
                "Questions must route through a visible support flow",
                "Admins publish clear escalation rules",
            ],
            "welcome_flow": [
                f"Welcome {audience} with one pinned orientation message",
                "Show main CTA, docs, and scam warning",
                "Prompt users toward one meaningful next action",
            ],
            "content_pillars": [
                "product progress",
                "proof/results",
                "education / FAQ",
                "community call-to-action",
            ],
            "posting_cadence": {
                "daily": ["1 short update", "1 reply/support sweep"],
                "weekly": ["1 proof post", "1 pinned message review", "1 FAQ refresh"],
                "style": posting_style,
            },
            "moderation_checklist": [
                "Review scam reports daily",
                "Keep FAQ and pinned post current",
                "Remove low-signal farming messages fast",
            ],
            "operator_playbook": {
                "new_member_goal": "Get the user to one meaningful action within the first session.",
                "escalation_rule": "Move sensitive/account issues into a controlled support path.",
                "spam_policy": "Remove repetitive farming behavior fast and visibly.",
            },
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "telegram_ops_kit",
            "sections_generated": 6,
            "focus": ["community trust", "moderation", "onboarding", "content ops"],
        }
    elif template.slug == "airdrop-bounty-builder":
        deliverable = {
            "campaign_structure": {
                "awareness": ["follow/join", "share campaign post"],
                "contribution": ["thread/comment", "content creation", "referral invite"],
                "review": ["proof queue", "duplicate check", "manual escalation"],
            },
            "task_matrix": {
                "low_effort": ["follow channel", "join community"],
                "medium_effort": ["publish thoughtful reply", "create one distribution post"],
                "high_effort": ["write original thread", "bring verified referral traffic"],
            },
            "reward_logic": {
                "base_rule": "Higher-value actions receive higher weighted rewards",
                "anti_sybil": "Duplicate wallet/social proofs are rejected",
                "quality_multiplier": "Original useful contributions outrank copy-paste tasks",
                "budget_note": reward_budget,
            },
            "proof_policy": [
                "Wallet proof",
                "Link/screenshot proof",
                "Manual review for suspicious submissions",
            ],
            "review_queue_rules": {
                "auto_reject": ["duplicate wallet", "missing proof", "obvious bot spam"],
                "manual_review": ["suspicious velocity", "copy-paste content", "identity ambiguity"],
                "approval_goal": "Keep payout quality high without turning review into a bottleneck",
            },
            "constraints": constraints or ["Avoid spam-farm incentives", "Keep review burden manageable"],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "bounty_campaign",
            "sections_generated": 6,
            "focus": ["reward design", "anti-sybil", "proof review", "task matrix"],
        }
    elif template.slug == "token-risk-report":
        deliverable = {
            "risk_summary": f"Structured first-pass risk snapshot for {project_name} / {token_symbol} on {chain}.",
            "risk_matrix": {
                "token_structure": {
                    "rating": "medium",
                    "reason": f"{token_symbol} is described as a {token_type}; exact issuance and governance constraints were not independently verified.",
                },
                "liquidity": {
                    "rating": "medium",
                    "reason": f"Current liquidity model is described as {liquidity_model}, but lock depth and durability still need proof.",
                },
                "operations": {
                    "rating": "medium",
                    "reason": "Operational claims, response speed, and treasury discipline require source validation.",
                },
                "market_positioning": {
                    "rating": "low_to_medium",
                    "reason": f"Narrative fit for {geography} users may be reasonable, but distribution proof is still needed.",
                },
            },
            "trust_signals": [
                "Public docs or known team presence",
                "Observable liquidity and treasury communication",
                "Consistency across website, socials, and token messaging",
                "Clear non-yield product positioning reduces obvious marketing risk",
            ],
            "red_flags": [
                "Holder concentration should be verified deeper",
                "Liquidity lock / treasury policy needs explicit proof",
                "Operational claims require source validation",
                "Any mismatch between token utility and public pitch should be treated as material risk",
            ],
            "missing_data": [
                "Top holder distribution",
                "Treasury / multisig disclosure",
                "Liquidity lock evidence",
                "Exchange / partner references",
            ],
            "next_verification_steps": [
                "Check holder concentration and vesting logic",
                "Verify treasury wallet disclosures and signer model",
                "Confirm liquidity durability and withdrawal controls",
                "Compare website claims against onchain / public evidence",
            ],
            "peer_context": competitors or ["Category peers not provided"],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "risk_report",
            "sections_generated": 6,
            "focus": ["risk matrix", "trust signals", "red flags", "verification steps"],
        }
    else:
        deliverable = {
            "summary": f"Workflow result generated for {project_name}.",
            "items": template.output_items,
        }
        execution_summary = {
            "mode": "template_stub",
            "artifact_kind": "generic",
            "sections_generated": len(template.output_items),
            "focus": [template.slug],
        }

    return {
        "status": "completed",
        "workflow_slug": template.slug,
        "template_title": template.title,
        "generated_at": generated_at,
        "delivery": template.output_items,
        "deliverable": deliverable,
        "execution_summary": execution_summary,
    }
