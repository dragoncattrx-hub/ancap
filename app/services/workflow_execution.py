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
        price=Money(amount="10", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        price=Money(amount="19", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        price=Money(amount="12", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        price=Money(amount="15", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        price=Money(amount="14", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=20,
        preview_items=["Risk summary", "Trust notes", "Flag categories"],
        output_items=["Risk snapshot", "Trust signals", "Operational flags", "Receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "asset_reference", "status_timeline"],
        tags=["risk", "token", "intelligence"],
    ),
    WorkflowTemplatePublic(
        slug="token-launch-audit-pack",
        title="Token Launch Audit Pack",
        category="Audit",
        summary="Audit launch readiness across token narrative, liquidity proof, campaign plan, and trust signals.",
        description="Produces a launch-readiness audit with scoring, gaps, mitigation tasks, and a proof-backed delivery receipt.",
        price=Money(amount="79", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=55,
        preview_items=["Launch readiness score", "Gap matrix", "Priority fixes"],
        output_items=["Audit scorecard", "Launch risk matrix", "Fix backlog", "Proof receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "provider_cost_estimate", "margin_snapshot", "status_timeline"],
        tags=["audit", "launch", "risk", "premium"],
    ),
    WorkflowTemplatePublic(
        slug="exchange-listing-submission-pack",
        title="Exchange Listing Submission Pack",
        category="Listings",
        summary="Prepare exchange-facing answers, due-diligence pack, market narrative, and submission checklist.",
        description="Creates a premium exchange listing submission pack designed for cleaner reviewer handoff and repeat submissions.",
        price=Money(amount="149", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=90,
        preview_items=["Exchange answer map", "Reviewer checklist", "Submission sequence"],
        output_items=["Exchange form answers", "Due-diligence packet", "Reviewer memo", "Proof receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "listing_readiness", "margin_snapshot", "status_timeline"],
        tags=["listing", "exchange", "launch", "premium"],
    ),
    WorkflowTemplatePublic(
        slug="kol-telegram-campaign-builder",
        title="KOL / Telegram Campaign Builder",
        category="Growth",
        summary="Build KOL briefs, Telegram campaign mechanics, proof policy, and attribution-ready growth flow.",
        description="Packages a campaign that can be handed to community operators, Telegram admins, and KOL partners without losing proof discipline.",
        price=Money(amount="99", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=70,
        preview_items=["KOL brief preview", "Telegram funnel", "Attribution plan"],
        output_items=["KOL brief kit", "Telegram campaign plan", "Partner scripts", "Proof receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "campaign_attribution", "margin_snapshot", "status_timeline"],
        tags=["kol", "telegram", "growth", "premium"],
    ),
    WorkflowTemplatePublic(
        slug="token-risk-report-pro",
        title="Token Risk Report Pro",
        category="Risk",
        summary="Create a pro-grade token risk report with scoring, evidence requests, wallet/liquidity checks, and buyer-ready summary.",
        description="Turns a lightweight token snapshot into a premium report with structured risks, evidence gaps, and recommended next checks.",
        price=Money(amount="59", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=50,
        preview_items=["Pro risk score", "Evidence gaps", "Buyer-ready summary"],
        output_items=["Risk scorecard", "Evidence request list", "Liquidity and holder flags", "Proof receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "asset_reference", "risk_score", "margin_snapshot", "status_timeline"],
        tags=["risk", "token", "report", "premium"],
    ),
    WorkflowTemplatePublic(
        slug="agent-api-readiness-pack",
        title="Agent API Readiness Pack",
        category="Developers",
        summary="Package a crypto API or workflow for AI-agent buyers with pricing, x402 metadata, docs, and spend controls.",
        description="Creates the commercial surface an external agent needs: endpoint offer, pricing copy, 402 response plan, curl examples, and receipt schema.",
        price=Money(amount="99", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=65,
        preview_items=["Endpoint offer map", "x402 payment shape", "Spend-control checklist"],
        output_items=["Developer offer page", "API pricing matrix", "x402 response plan", "Proof receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "x402_payment_terms", "margin_snapshot", "status_timeline"],
        tags=["api", "x402", "agents", "premium"],
    ),
    WorkflowTemplatePublic(
        slug="ai-iso-governance-readiness-pack",
        title="AI / ISO Governance Readiness Pack",
        category="Governance",
        summary="Turn an AI workflow into an audit-ready operating pack with SOPs, risk controls, evidence, and corrective-action flow.",
        description="Maps AI execution, LLM supplier controls, proof receipts, audit trails, and ISO-inspired operating discipline into a practical governance packet. This is readiness support, not a certification guarantee.",
        price=Money(amount="149", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        estimated_time_minutes=90,
        preview_items=["AI capability map", "ISO-style control checklist", "Evidence and audit trail plan"],
        output_items=["AI governance memo", "SOP checklist", "Risk and control matrix", "Corrective-action plan", "Proof receipt"],
        receipt_items=["workflow_slug", "price_snapshot", "input_hash", "ai_governance_scope", "control_evidence_map", "status_timeline"],
        tags=["ai", "iso", "governance", "audit", "premium"],
        ai_system_card={
            "capability": "structured-generation",
            "capability_detail": "LLM-assisted generation of governance, audit, and compliance documentation",
            "supplier": {"provider": "Anthropic (Teneta)", "model": "claude-sonnet-4-6"},
            "fallback": "template-based shell with degraded_run=true when LLM is unavailable",
            "audit_evidence": ["prompt", "model", "provider_status", "output_hash", "receipt"],
            "corrective_action_plan": ["Owner assignment on degraded runs", "Human review for premium outputs", "Root cause logged in llm_usage_events"],
        },
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
        price=Money(amount="49", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        price=Money(amount="59", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        price=Money(amount="149", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
    WorkflowBundlePublic(
        slug="pro-launch-pack",
        title="ANCAP Pro Launch Pack",
        category="Premium Launch",
        summary="Higher-ticket launch execution pack for teams that need listing, audit, KOL, bounty, and pro risk artifacts together.",
        description="Bundles the premium launch audit, exchange submission pack, KOL/Telegram campaign, bounty builder, and pro token risk report into one proof-backed checkout.",
        workflow_slugs=[
            "token-launch-audit-pack",
            "exchange-listing-submission-pack",
            "kol-telegram-campaign-builder",
            "airdrop-bounty-builder",
            "token-risk-report-pro",
        ],
        price=Money(amount="349", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        discount_percent=13,
        estimated_time_minutes=295,
        output_items=[
            "Launch readiness audit",
            "Exchange listing submission pack",
            "KOL / Telegram campaign kit",
            "Airdrop / bounty structure",
            "Token Risk Report Pro",
            "Five proof-backed workflow receipts",
        ],
        tags=["bundle", "launch", "premium", "risk", "growth"],
    ),
    WorkflowBundlePublic(
        slug="agent-commerce-pack",
        title="ANCAP Agent Commerce Pack",
        category="Agent Commerce",
        summary="A B2B pack for API owners and AI-agent builders who want pay-per-call monetization fast.",
        description="Combines API readiness, campaign positioning, listing copy, and proof-center setup so external agents can discover, pay, and verify ANCAP-style execution.",
        workflow_slugs=[
            "agent-api-readiness-pack",
            "crypto-campaign-builder",
            "token-listing-pack",
            "token-risk-report-pro",
        ],
        price=Money(amount="249", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        discount_percent=5,
        estimated_time_minutes=165,
        output_items=[
            "Agent/API paid endpoint offer",
            "x402-compatible payment terms",
            "Developer pricing matrix",
            "Proof-center receipt schema",
        ],
        tags=["bundle", "api", "x402", "agents"],
    ),
]


WORKFLOW_CREDIT_PACKAGES: list[WorkflowCreditPackagePublic] = [
    WorkflowCreditPackagePublic(
        slug="starter-credits",
        title="Starter Credits",
        description="Enough balance to run one launch workflow or test the paid execution loop.",
        price=Money(amount="25", currency="ACP"),
        credit_amount=Money(amount="25", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        bonus_percent=0,
        recommended_for=["first paid workflow", "proof bundle test"],
    ),
    WorkflowCreditPackagePublic(
        slug="launch-credits",
        title="Launch Credits",
        description="Best fit for the Launch Pack plus one or two follow-up reruns.",
        price=Money(amount="95", currency="ACP"),
        credit_amount=Money(amount="100", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
        bonus_percent=5,
        recommended_for=["launch pack", "campaign iteration"],
    ),
    WorkflowCreditPackagePublic(
        slug="growth-credits",
        title="Growth Credits",
        description="A larger balance for repeated launch, growth, and risk workflows.",
        price=Money(amount="225", currency="ACP"),
        credit_amount=Money(amount="250", currency="ACP"),
        accepted_currencies=["ACP", "wACP"],
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
        "sample_output_url": f"/sample-reports/{template.slug}",
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
    elif template.slug == "token-launch-audit-pack":
        deliverable = {
            "launch_readiness_score": 78,
            "scorecard": {
                "positioning": {"score": 82, "note": f"{project_name} has a clear buyer narrative for {audience} if proof examples are visible."},
                "liquidity_proof": {"score": 64, "note": f"{liquidity_model} needs lock, depth, and counterparty evidence before premium promotion."},
                "listing_readiness": {"score": 76, "note": "Core listing materials can be prepared, but reviewer evidence should be attached."},
                "campaign_quality": {"score": 84, "note": "Campaign can lead with execution outcomes and avoid investment-return language."},
            },
            "priority_fixes": [
                "Publish a one-page token utility memo with non-yield language",
                "Attach liquidity lock or treasury-control evidence",
                "Prepare proof links for website, docs, team/contact, and socials",
                "Create a reviewer-facing launch checklist before paid distribution",
            ],
            "go_no_go": {
                "status": "conditional_go",
                "reason": "Launch can proceed after evidence pack and liquidity proof are tightened.",
            },
            "proof_requests": ["liquidity lock", "top holder distribution", "treasury signer model", "official links"],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "launch_audit",
            "sections_generated": 5,
            "focus": ["readiness score", "gap matrix", "evidence requests", "launch fixes"],
        }
    elif template.slug == "exchange-listing-submission-pack":
        deliverable = {
            "submission_positioning": f"{project_name} should present {token_symbol} as product access and operational coordination, not as a passive return instrument.",
            "exchange_answer_bank": {
                "project_overview": f"{project_name} serves {audience} with crypto-native execution tooling on {chain}.",
                "token_utility": f"{token_symbol} is framed as a {token_type} tied to platform access, fees, incentives, and proof-backed operations.",
                "market_need": f"{market} buyers need concise launch, listing, campaign, and risk artifacts with auditable receipts.",
                "compliance_posture": "Do not promise yield, price appreciation, or investment outcomes; keep claims tied to software/service execution.",
            },
            "reviewer_packet": [
                "Token contract and chain details",
                "Website, docs, socials, and contact route",
                "Liquidity and treasury evidence",
                "Token utility memo",
                "Risk and disclosure note",
            ],
            "submission_sequence": ["directory listing", "DEX analytics profile", "centralized exchange intake", "partner marketplace update"],
            "red_line_claims": ["guaranteed returns", "risk-free yield", "price target", "exchange approval guarantee"],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "exchange_listing_submission",
            "sections_generated": 5,
            "focus": ["exchange answers", "reviewer packet", "submission sequence", "safe claims"],
        }
    elif template.slug == "kol-telegram-campaign-builder":
        deliverable = {
            "campaign_offer": f"Promote {project_name} as useful execution infrastructure for {audience}, with proof links and a concrete next action.",
            "kol_brief": {
                "angle": "paid AI execution for crypto teams, not vague AI/Web3 hype",
                "must_include": ["one concrete buyer pain", "one proof/receipt point", "one CTA"],
                "must_avoid": ["investment promises", "fake urgency", "undisclosed paid claims"],
            },
            "telegram_funnel": [
                "Pinned proof post with sample output",
                "Daily operator update",
                "Live Q&A or office-hours thread",
                "Paid report/workflow CTA",
            ],
            "partner_scripts": {
                "short_dm": f"{project_name} sells proof-backed AI workflow execution for launch/listing/growth teams. Want a sample report link?",
                "public_post": f"{project_name} packages listing packs, campaign builders, bounty flows, and token risk reports with receipts.",
            },
            "attribution_plan": ["referral code per partner", "paid-run conversion tracking", "commission only after captured payment"],
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "kol_telegram_campaign",
            "sections_generated": 5,
            "focus": ["KOL brief", "Telegram funnel", "partner scripts", "attribution"],
        }
    elif template.slug == "token-risk-report-pro":
        deliverable = {
            "risk_summary": f"Pro risk review for {project_name} / {token_symbol} on {chain}.",
            "overall_score": 71,
            "risk_domains": {
                "holder_concentration": {"rating": "needs_evidence", "request": "top holders, vesting, lockups"},
                "liquidity_durability": {"rating": "medium", "request": "lock proof, pool depth, withdrawal controls"},
                "team_and_ops": {"rating": "medium", "request": "official contacts, response policy, treasury signer model"},
                "market_integrity": {"rating": "medium", "request": "campaign disclosure and anti-sybil controls"},
            },
            "buyer_ready_summary": f"{token_symbol} can be reviewed as a {token_type}, but buyers and partners should request liquidity, holder, and treasury evidence before higher-risk commitments.",
            "evidence_gap_queue": ["holder CSV or explorer link", "liquidity lock proof", "treasury policy", "campaign disclosures"],
            "upgrade_path": "Run Token Launch Audit Pack or Exchange Listing Submission Pack for a fuller launch-readiness packet.",
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "risk_report_pro",
            "sections_generated": 5,
            "focus": ["risk score", "evidence gaps", "buyer summary", "upgrade path"],
        }
    elif template.slug == "agent-api-readiness-pack":
        deliverable = {
            "endpoint_offer": {
                "buyer": "AI agents, crypto tools, dashboards, and operators needing paid on-demand checks",
                "pricing_model": "pay-per-call with prepaid credits now, x402-compatible HTTP 402 terms next",
                "receipt_model": "every paid call records usage, amount, request hash, and machine-readable result",
            },
            "x402_response_plan": {
                "status": 402,
                "network": "Base",
                "currency": "ACP",
                "fields": ["accepts", "amount", "pay_to", "resource", "expires_at", "proof_url"],
            },
            "spend_controls": ["monthly cap per agent", "per-key usage export", "402 insufficient balance response", "request hash for retries"],
            "developer_docs_outline": ["products", "pricing", "curl examples", "API key setup", "receipt/proof format"],
            "sample_curl": "curl -X POST https://ancap.cloud/api/v1/paid-api/token-risk -H 'X-API-Key: ...' -d '{\"subject\":\"TOKEN\",\"chain\":\"Base\"}'",
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "agent_api_readiness",
            "sections_generated": 5,
            "focus": ["API pricing", "x402 terms", "spend controls", "developer docs"],
        }
    elif template.slug == "ai-iso-governance-readiness-pack":
        ai_system = str(payload.get("ai_system") or payload.get("workflow_name") or project_name)
        intended_use = str(payload.get("intended_use") or "paid AI workflow execution")
        risk_level = str(payload.get("risk_level") or "medium")
        owner = str(payload.get("owner") or "platform owner")
        deliverable = {
            "governance_summary": f"{ai_system} should be operated as a controlled AI workflow with documented scope, owner, inputs, outputs, supplier dependencies, and proof receipts.",
            "ai_capability_map": {
                "learning_or_generation": "LLM-assisted generation is used for workflow artifacts; deterministic templates remain fallback only.",
                "reasoning_and_planning": "The workflow should record prompt, model, provider status, output sections, and quality checks.",
                "decision_support": "Outputs should support buyer/operator decisions, not claim autonomous investment or compliance approval.",
                "human_oversight": f"{owner} owns review, exception handling, and release decisions for higher-risk outputs.",
            },
            "iso_style_control_matrix": {
                "scope_and_policy": ["Define workflow scope", "Publish acceptable-use limits", "Avoid investment-return claims"],
                "risk_management": ["Classify use case risk", "Log failure mode", "Mark degraded fallback outputs"],
                "documented_information": ["Store run inputs hash", "Store output/proof hash", "Keep receipt and audit trail"],
                "supplier_controls": ["Track LLM provider", "Track model version", "Track latency/status/cost estimate"],
                "operation_and_monitoring": ["Use rate limits", "Monitor paid run failure rate", "Review degraded receipts"],
                "corrective_actions": ["Assign owner", "Record root cause", "Verify fix before closing"],
            },
            "audit_ready_evidence": [
                "Workflow specification and version",
                "Prompt/provider/model metadata",
                "Input, output, and receipt hashes",
                "Payment intent and capture status",
                "Fallback/degraded-mode marker when applicable",
                "Corrective-action record for incidents or nonconformities",
            ],
            "sop_checklist": [
                "Define buyer-facing promise and excluded claims",
                "Collect required inputs before execution",
                "Run LLM or approved fallback with status logging",
                "Perform quality review for premium reports",
                "Generate receipt/proof bundle",
                "Escalate failed or degraded paid runs",
            ],
            "readiness_score": {
                "score": 76,
                "risk_level": risk_level,
                "note": "Ready for controlled internal use after evidence retention, degraded-output labeling, and corrective-action ownership are verified.",
            },
            "certification_note": "This pack prepares operating evidence and controls; it does not certify ISO conformity or replace an accredited audit.",
        }
        execution_summary = {
            "mode": "workflow_specific",
            "artifact_kind": "ai_iso_governance_readiness",
            "sections_generated": 6,
            "focus": ["AI governance", "ISO-style controls", "audit evidence", "corrective actions"],
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
