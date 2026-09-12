"""Startup-investment literacy desk — ACP-paid market screens, not a securities offering.

Public journalism / rating cites as of 12 September 2026:
- CNews + Spark-Interfax ICT gazelles (2021–2025): GA Tactic / Zolotoe Yabloko
- Forbes / FRIИ fastest-growing small IT (AI tutors, agrotech software)
- Sky.pro: AI, SECaaS, FinTech idea ranges (third-party estimates, not ANCAP forecasts)
- businessmens.ru: agrotech / production digitalization niches

ANCAP is not affiliated with those publishers or named companies.
"""
from __future__ import annotations

from typing import Any

BRIEF_IDS: dict[str, str] = {
    "startup-market-map": "e5000006-0000-4000-8000-000000000001",
    "startup-retail-b2b": "e5000006-0000-4000-8000-000000000002",
    "startup-ai-ml": "e5000006-0000-4000-8000-000000000003",
    "startup-secaas": "e5000006-0000-4000-8000-000000000004",
    "startup-agrotech": "e5000006-0000-4000-8000-000000000005",
    "startup-gazelle-diligence": "e5000006-0000-4000-8000-000000000006",
}

CNEWS_GAZELLE = (
    "https://www.cnews.ru/news/top/2026-08-13_samaya_bystrorastushchaya_it-kompaniya"
)
FORBES_FRII = (
    "https://www.forbes.ru/svoi-biznes/548659-soft-dla-upravlenia-korovami-i-ii-repetitory-"
    "8-samyh-bystrorastusih-it-kompanij"
)
SKY_PRO = (
    "https://sky.pro/wiki/profession/15-perspektivnykh-it-biznesov-ot-iskusstvennogo-intellekta-do-fin-tech/"
)
BUSINESSMENS = "https://businessmens.ru/article/biznes-v-sfere-tehnologiy"

RESEARCH_REF = {
    "id": "cnews-spark-ict-gazelles-2026",
    "title": "CNews / Spark-Interfax — fastest-growing Russian ICT gazelles (13 Aug 2026)",
    "url": CNEWS_GAZELLE,
    "note": (
        "Public ranking journalism. Leader cited: OOO «Джиэй Тэктим» (GA Tech Team), "
        "Yekaterinburg, ~112.71% revenue CAGR 2021–2025, 4.883 bn RUB revenue in 2025, "
        "single reported client «Золотое яблоко». ANCAP is not affiliated and does not "
        "offer that company’s equity."
    ),
}

RESEARCH_REFS: tuple[dict[str, str], ...] = (
    RESEARCH_REF,
    {
        "id": "forbes-frii-small-it-2024",
        "title": "Forbes / FRIИ — 8 fastest-growing small IT firms (cow-management software, AI tutors)",
        "url": FORBES_FRII,
        "note": (
            "Public FRIИ small-business IT growth study as reported by Forbes. "
            "Cited niches include farm/herd software and AI exam tutors (e.g. 01Математика). "
            "Literacy only; not an ANCAP ranking or recommendation."
        ),
    },
    {
        "id": "skypro-it-business-ideas-2025",
        "title": "Sky.pro — 15 prospective IT businesses (AI, SECaaS, FinTech idea ranges)",
        "url": SKY_PRO,
        "note": (
            "Third-party idea ranges (e.g. SECaaS start $40–120k). Not ANCAP forecasts, "
            "not TAM/SAM diligence, not a promise of profit."
        ),
    },
    {
        "id": "businessmens-tech-niches-2026",
        "title": "businessmens.ru — 10 technology-business directions for 2026 (agrotech, production IT)",
        "url": BUSINESSMENS,
        "note": (
            "Public niche survey (updated 5 Mar 2026): agrotech IoT/ERP, medtech, transport IT. "
            "Educational context for /startups screens."
        ),
    },
)

SECTORS: tuple[dict[str, str], ...] = (
    {
        "id": "ai_ml",
        "label": "AI / generative neural nets",
        "role": "assistants, routine automation, AI tutors",
        "thesis": (
            "Public sources put specialised AI/ML products among the fastest idea-generation "
            "tracks (Sky.pro) and among FRIИ small-IT gazelles (AI tutors). CNews/Spark 2021–2025 "
            "CAGR ranking of independent ICT firms did not yet put pure-play AI in the top 10 — "
            "analysts noted the five-year window smooths a later AI demand spike."
        ),
    },
    {
        "id": "retail_ecommerce",
        "label": "IT for retail & e-commerce (B2B ops)",
        "role": "WMS, last-mile, call-center, sales analytics",
        "thesis": (
            "CNews: the 2021–2025 ICT gazelle #1 is an in-house retail/e-commerce stack for "
            "«Золотое яблоко» (Picklo WMS, field-service courier, unified call-center). "
            "Spark-Interfax framing: growth is shifting from import-substitution/state orders "
            "toward measurable commercial efficiency — with concentration risk if there is one anchor client."
        ),
    },
    {
        "id": "secaas",
        "label": "Cybersecurity as a service (SECaaS)",
        "role": "cloud protective stacks under rising digital threats",
        "thesis": (
            "Sky.pro lists SECaaS among high-barrier IT businesses. Strategy Partners commentary "
            "in the CNews piece expects 2026 durability in information security, industrial "
            "automation, and domestic electronics — not a guarantee of any named vendor."
        ),
    },
    {
        "id": "agrotech_industry",
        "label": "Agrotech & production digitalization",
        "role": "herd/farm software, plant ERP, shop-floor control",
        "thesis": (
            "Forbes/FRIИ highlights farm/herd software among small-IT gazelles; businessmens.ru "
            "(2026) maps agrotech IoT, harvest prediction, and factory digital twins. "
            "Literacy for screens — ANCAP does not operate farms or plants."
        ),
    },
)

PRINCIPLES: tuple[dict[str, str], ...] = (
    {
        "id": "S1",
        "title": "This desk is not a securities offering",
        "body": (
            "ANCAP sells ACP-paid research briefs and partner-handoff intents. It is not a "
            "broker-dealer, crowdfunding portal, or prospectus. No equity, tokens-as-shares, "
            "or promised yield is issued here."
        ),
    },
    {
        "id": "S2",
        "title": "Journalism and rankings are not forecasts",
        "body": (
            "CNews/Spark, Forbes/FRIИ, Sky.pro, and businessmens.ru are third-party sources. "
            "Past gazelle CAGRs (e.g. ~112.71% for GA Tactic 2021–2025) do not predict future "
            "returns. Sky.pro profit bands are idea sketches, not ANCAP models."
        ),
    },
    {
        "id": "S3",
        "title": "Anchor-client concentration is a first-class risk",
        "body": (
            "CNews reports GA Tactic’s growth is tied to a single client (Zolotoe Yabloko) and "
            "that solutions were not yet sold on the open market. Fast revenue can be captive "
            "ops spend, not a transferable SaaS franchise."
        ),
    },
    {
        "id": "S4",
        "title": "Prefer measurable B2B efficiency over narrative AI",
        "body": (
            "Spark-Interfax (via CNews) argues the import-substitution/state-order growth window "
            "is fading; remaining leaders must show scalable, profitable models. Screens ask for "
            "ops KPIs (fill rate, pick time, loss, MTTD) — not demo-day slides."
        ),
    },
    {
        "id": "S5",
        "title": "Five-year CAGR can hide a late AI spike",
        "body": (
            "Strategy Partners noted independent ICT gazelle top-10 (2021–2025) lacked pure-play "
            "AI because the method averages a later demand jump. Treat missing AI names as a "
            "methodology note, not “AI is dead.”"
        ),
    },
    {
        "id": "S6",
        "title": "SECaaS and shop-floor IT remain 2026 durability themes in cited commentary",
        "body": (
            "Public expert notes in the same CNews article flag information security, industrial "
            "automation, and domestic electronics as likelier durable 2026 drivers — still not "
            "an ANCAP buy list."
        ),
    },
    {
        "id": "S7",
        "title": "Agrotech is a product niche, not a cow-collar warranty",
        "body": (
            "FRIИ/Forbes farm software and businessmens.ru IoT/ERP maps are literacy. ANCAP does "
            "not sell livestock hardware or agronomic advice."
        ),
    },
    {
        "id": "S8",
        "title": "Licensed partners settle regulated deals off-platform",
        "body": (
            "If a screen graduates to a real share, note, or SAFE, a licensed partner closes it "
            "under local securities law. ACP on this desk pays for the brief, not the security."
        ),
    },
)

BRIEFS: tuple[dict[str, str], ...] = (
    {
        "id": "startup-market-map",
        "label": "IT gazelle market map (AI, retail B2B, SECaaS, agrotech)",
        "sector": "ai_ml",
        "price_from_acp": "25000",
        "blurb": (
            "Source-tagged map of the four cited growth tracks as of 12 Sep 2026. "
            "Outputs: sector one-pagers + source URLs. Not a buy list."
        ),
    },
    {
        "id": "startup-retail-b2b",
        "label": "Retail / e-commerce ops-efficiency screen",
        "sector": "retail_ecommerce",
        "price_from_acp": "40000",
        "blurb": (
            "WMS, last-mile, call-center, and merchandising IT for large retail/e-comm. "
            "Includes concentration-risk checklist from the GA Tactic / Golden Apple case as reported."
        ),
    },
    {
        "id": "startup-ai-ml",
        "label": "AI assistant / tutor / routine-automation screen",
        "sector": "ai_ml",
        "price_from_acp": "45000",
        "blurb": (
            "Applied AI with a named buyer and a measurable hour-saved KPI. "
            "FRIИ AI-tutor gazelles are context, not comparable comps."
        ),
    },
    {
        "id": "startup-secaas",
        "label": "SECaaS / cloud-protection screen",
        "sector": "secaas",
        "price_from_acp": "35000",
        "blurb": (
            "Partner brief for cloud protective stacks aimed at SME/KII-adjacent buyers. "
            "No exploit payloads; literacy and vendor-process mapping only."
        ),
    },
    {
        "id": "startup-agrotech",
        "label": "Agrotech / plant-digitalization screen",
        "sector": "agrotech_industry",
        "price_from_acp": "35000",
        "blurb": (
            "Herd/farm software, soil/IoT, harvest prediction, factory MES/ERP. "
            "Educational mapping from FRIИ/Forbes and businessmens.ru — not agronomy."
        ),
    },
    {
        "id": "startup-gazelle-diligence",
        "label": "ICT gazelle diligence pack (Spark-Interfax literacy)",
        "sector": "retail_ecommerce",
        "price_from_acp": "75000",
        "blurb": (
            "How to read a gazelle print: CAGR window, single-client contracts, software-registry "
            "listings, leverage vs equity. Uses public CNews/Spark figures as a worked example, "
            "not a solicitation of that issuer."
        ),
    },
)


def catalog() -> dict[str, Any]:
    briefs: list[dict[str, str]] = []
    for row in BRIEFS:
        item = dict(row)
        item["review_target_id"] = BRIEF_IDS[row["id"]]
        briefs.append(item)
    return {
        "title": "Startup investment desk",
        "tagline": (
            "ACP-paid screens of the fastest-cited IT tracks — AI/ML, retail B2B ops, "
            "SECaaS, and agrotech/production software — as of 12 September 2026."
        ),
        "compliance_note": (
            "ANCAP sells research briefs and licensed-partner handoffs settled in ACP. "
            "This is not a securities offering, crowdfunding portal, investment fund, or "
            "promise of return. Rankings and idea ranges belong to their publishers. "
            "ANCAP is not affiliated with CNews, Spark-Interfax, Forbes, FRIИ, Sky.pro, "
            "businessmens.ru, GA Tactic, Zolotoe Yabloko, or named gazelle issuers. "
            "See /legal/research-refs §9 and docs/STARTUP_INVEST_DESK.md."
        ),
        "as_of": "2026-09-12",
        "research_ref": dict(RESEARCH_REF),
        "research_refs": [dict(r) for r in RESEARCH_REFS],
        "sectors": [dict(s) for s in SECTORS],
        "principles": [dict(p) for p in PRINCIPLES],
        "briefs": briefs,
        "principles_doc": "docs/STARTUP_INVEST_DESK.md",
        "legal_href": "/legal/research-refs",
    }
