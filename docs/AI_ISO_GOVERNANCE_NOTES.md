# AI And ISO Governance Notes For ANCAP

> Status: active reference | Updated: 2026-05-23

This document turns the requested source material into practical ANCAP product and operating guidance. It is not a legal, audit, or certification opinion. It is a product reference for paid AI-workflows, proof receipts, LLM execution, creator listings, and ACP-first monetization.

## Source Material

- Wikipedia, "Artificial intelligence": <https://en.wikipedia.org/wiki/Artificial_intelligence>
- SafetyCulture, "ISO" topic page requested by user: <https://safetyculture.com/de/themen/iso>
- SafetyCulture indexed ISO audit material: <https://safetyculture.com/health-and-safety/iso-audit>
- ISO/IEC 42001 official summary: <https://www.iso.org/standard/81230.html>
- ISO/IEC 27001 official summary: <https://www.iso.org/standard/27001>

## What To Keep From The AI Source

AI should be described in ANCAP as software capability, not magic or investment advice.

Useful AI concepts for ANCAP:

- AI systems perform tasks associated with human intelligence, including learning, reasoning, problem-solving, perception, and decision-making.
- ANCAP should frame its workflows around concrete capabilities: natural-language generation, planning, knowledge representation, risk scoring, tool/API use, and structured decision support.
- AI agents are useful as buyer/seller/operator actors only when the system records their goal, input, action, output, and receipt trail.
- Generative AI output must be treated as generated evidence or draft execution, not automatically as truth.
- Key risks to control are privacy, misinformation, bias/fairness, lack of transparency, misuse by bad actors, and overclaiming what the system can prove.

Implication for ANCAP:

- Every paid AI-workflow should show what AI is doing, what deterministic controls are doing, and what is only a recommendation.
- Premium workflow receipts must include provider/model metadata, input/output hashes, status timeline, fallback/degraded marker, and proof URL.
- Product copy must avoid claims like guaranteed compliance, guaranteed listing, guaranteed profit, or fully autonomous investment decision.

## What To Keep From The ISO Source

ISO thinking is useful for ANCAP because it turns "we ran an AI workflow" into "we ran a controlled, documented, repeatable process."

SafetyCulture's ISO audit materials emphasize:

- standardized workflows and SOPs;
- reusable audit templates;
- complete audit trails and documentation;
- corrective actions for nonconformities;
- assignment, deadlines, status tracking, and reporting;
- real-time monitoring and analytics;
- training and knowledge sharing.

Implication for ANCAP:

- Proof Center should become more than a receipt viewer. It should behave like an evidence room: inputs, outputs, payment, model/provider state, audit events, degraded mode, and corrective actions.
- Admin Audit Log should support follow-up tasks for failed runs, refunds, LLM incidents, bridge issues, and webhook delivery failures.
- Creator workflow publishing should include an SOP checklist before a workflow can be marketed as premium.
- Buyer-facing pages should explain that ANCAP helps with readiness and evidence, not accredited ISO certification.

## Standards Most Relevant To ANCAP

| Standard | Why It Matters For ANCAP | Practical Product Translation |
| --- | --- | --- |
| ISO/IEC 42001 | AI management system for responsible AI development, provision, and use. | AI workflow scope, risk assessment, supplier/model controls, human oversight, documentation, continuous improvement. |
| ISO/IEC 27001 | Information security management system and risk management process. | Secrets handling, API key management, access control, audit logs, incident handling, backup/restore, supplier security. |
| ISO 9001 | Quality management and repeatable process discipline. | Workflow SOPs, quality gates, customer feedback, corrective actions, versioned templates, repeatable paid delivery. |
| ISO 19011 | Audit guidance. | Internal audit schedule, evidence collection, findings, corrective actions, follow-up checks. |

## New Product Opportunity

Add and promote a premium SKU:

**AI / ISO Governance Readiness Pack**

Target buyers:

- crypto teams using AI-generated campaign/listing/risk reports;
- AI-agent builders who need buyer trust;
- API owners selling pay-per-call checks;
- B2B teams that need audit-friendly evidence before larger partnerships.

Deliverables:

- AI governance memo;
- workflow SOP checklist;
- risk and control matrix;
- LLM provider and model evidence map;
- proof/receipt retention plan;
- corrective-action workflow for failed/degraded paid runs.

Positioning:

- "Prepare audit-ready AI workflow evidence."
- "Make paid AI execution repeatable, documented, and reviewable."
- "Readiness support, not certification guarantee."

Price guidance:

- Single workflow: `149 ACP`.
- Bundle opportunity later: `Governance Pack` at `299-499 ACP` including AI/ISO readiness, Agent API readiness, Token Risk Report Pro, and Launch Audit Pack.

## Controls To Add To ANCAP

### 1. AI System Card Per Workflow

Each premium workflow should have a machine-readable card:

- workflow slug and version;
- intended use;
- excluded use;
- model/provider;
- input schema;
- output schema;
- human-review requirement;
- fallback/degraded policy;
- known limitations;
- proof fields.

### 2. Degraded Output Policy

If LLM fallback is used:

- show `execution_mode=degraded`;
- display provider failure class;
- keep the receipt truthful;
- offer rerun/refund/admin review based on SKU;
- include degraded run count in revenue quality dashboard.

### 3. Corrective Action Records

Add a lightweight issue/CAPA model later:

- source: workflow run, API call, webhook delivery, bridge event, support ticket;
- severity;
- owner;
- due date;
- root cause;
- correction;
- preventive action;
- verification result;
- linked receipt/proof URL.

### 4. Internal Audit Schedule

Monthly checks:

- LLM provider reliability;
- paid workflow fallback rate;
- refunds and failed payment intents;
- admin access allowlist;
- API key abuse and rate limits;
- proof receipt integrity;
- bridge reserve proof health;
- creator workflow quality.

### 5. ISO-Style Evidence Retention

For paid workflows keep:

- request body hash;
- normalized input JSON;
- template version;
- model/provider metadata;
- output hash;
- payment intent;
- receipt/proof URL;
- audit log event IDs;
- corrective-action ID if the run failed or degraded.

## Roadmap Additions

P0/P1:

- Keep the new `AI / ISO Governance Readiness Pack` visible in workflow catalog and pricing.
- Add sample report for the new SKU.
- Add `execution_mode`, `provider_status`, and degraded flag to receipt display if not already visible.

P2:

- Add AI system card fields to workflow templates.
- Add owner-facing dashboard for degraded paid runs and corrective actions.
- Add admin audit filters for `llm_failure`, `degraded_output`, `refund`, `webhook_failure`, and `bridge_pause`.

P3:

- Add a lightweight CAPA/corrective-action module.
- Add governance export: CSV/JSON evidence pack per workflow run.
- Add organization-level policy templates for B2B teams.

P4:

- Evaluate formal ISO/IEC 42001 and ISO/IEC 27001 readiness with an accredited advisor if ANCAP targets enterprise buyers.

## Product Copy Rules

Use:

- "AI workflow execution"
- "audit-ready evidence"
- "proof-backed receipt"
- "readiness pack"
- "structured risk and control matrix"
- "corrective-action workflow"

Avoid:

- "ISO certified" unless ANCAP actually receives certification.
- "guaranteed compliance"
- "guaranteed exchange listing"
- "guaranteed returns"
- "fully autonomous decision without oversight"

## Immediate Implementation Completed In This Tranche

- Added `AI / ISO Governance Readiness Pack` to backend workflow templates.
- Added a workflow-specific result shell for AI governance and ISO-style controls.
- Added frontend fallback catalog entry.
- Added sample report support.
- Added pricing/workflow catalog visibility.

