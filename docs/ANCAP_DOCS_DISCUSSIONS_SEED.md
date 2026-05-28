# ANCAP docs repo Discussions seed

Status: active prep for the future public `ancap-docs` repository.

This file captures the initial GitHub Discussions shape for the future public docs repo so the first public community surface starts with clear lanes instead of one undifferentiated thread bucket.

## Goal

Enable GitHub Discussions with a small, public-safe category set that helps contributors separate ideas, support questions, and integration/audit conversation.

## Recommended categories

### 1. `Ideas`
Use for:
- docs improvements
- proposed repo structure improvements
- public transparency/trust improvements
- future public-safe split ideas (`ancap-sdk`, `ancap-contracts`, `ancap-examples`)

### 2. `Q&A`
Use for:
- integration questions
- docs clarification requests
- contract verification questions
- bridge-risk / trust-surface questions that do not contain private operator details

### 3. `Show and tell`
Use for:
- public integrations built on ANCAP docs/specs
- example tooling
- tutorials and walkthroughs
- public merchant/wallet/dev experiments

### 4. `Announcements`
Use for:
- docs repo milestone updates
- release-note pointers
- public roadmap/status updates
- audit-readiness and transparency updates

## Moderator rules

- Keep Discussions public-safe: no secrets, private infra details, wallet keys, deploy tokens, or signer/operator runbooks.
- Move actionable bug reports and feature requests into Issues when they need tracking.
- Redirect security disclosures to `SECURITY.md` instead of handling them in public threads.
- Prefer Discussions for exploratory conversation and Issues for concrete work items.

## Suggested first pinned topics

1. **Welcome / how to use this repo**
   - explain what `ancap-docs` is for
   - point to roadmap/status/docs entry points
   - remind contributors not to post secrets or operator-only details

2. **Where to ask what**
   - Issues → concrete bugs/features/docs tasks
   - Discussions → questions, ideas, integration chatter
   - Security reports → `SECURITY.md`

3. **Public scope boundaries**
   - clarify what ANCAP publishes here
   - clarify what remains private by design

## Bootstrap usage

During the first `ancap-docs` repo setup:

1. Enable GitHub Discussions.
2. Create the categories above.
3. Add the pinned welcome/scope/routing topics.
4. Link the Discussions surface from the root `README.md` or repo sidebar when the public repo exists.

## Definition of done for this prep slice

This seed is doing its job when the future docs repo can open Discussions with clear public-safe defaults, minimal moderator ambiguity, and no need to invent the category model from scratch during launch.
