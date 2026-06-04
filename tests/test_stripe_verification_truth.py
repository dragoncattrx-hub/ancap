from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
README = REPO_ROOT / "README.md"
MASTER_ROADMAP = REPO_ROOT / "MASTER_ROADMAP.md"
STATUS_MATRIX = REPO_ROOT / "docs" / "STATUS_MATRIX.md"
STRIPE_RUNBOOK = REPO_ROOT / "docs" / "STRIPE_VERIFICATION_RUNBOOK.md"
STRIPE_EVIDENCE_TEMPLATE = REPO_ROOT / "docs" / "STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md"
STRIPE_SETTLEMENT_HELPER = REPO_ROOT / "frontend-app" / "src" / "app" / "wallet" / "credits" / "stripe-settlement.ts"
STRIPE_SETTLEMENT_TEST = REPO_ROOT / "frontend-app" / "src" / "app" / "wallet" / "credits" / "stripe-settlement.test.ts"
WALLET_CREDITS_PAGE = REPO_ROOT / "frontend-app" / "src" / "app" / "wallet" / "credits" / "page.tsx"
PAYMENTS_API_TESTS = REPO_ROOT / "tests" / "api" / "test_payments.py"
STRIPE_PACKET_GENERATOR = REPO_ROOT / "scripts" / "generate_stripe_verification_packet.py"


def test_readme_roadmap_and_status_keep_stripe_manual_closure_explicit() -> None:
    readme_text = README.read_text(encoding="utf-8")
    roadmap_text = MASTER_ROADMAP.read_text(encoding="utf-8")
    status_text = STATUS_MATRIX.read_text(encoding="utf-8")

    assert "docs/STRIPE_VERIFICATION_RUNBOOK.md" in readme_text
    assert "docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md" in readme_text
    assert "python scripts/generate_stripe_verification_packet.py" in readme_text
    assert "Item 4.1 is not done until webhook-delivered capture and saved-card reuse are both verified against a real/test Stripe customer." in readme_text

    assert "### 4.1 Stripe / fiat payment gateway [HIGH]" in roadmap_text
    assert "Status: [~]" in roadmap_text
    assert "Remaining blocker before this can be marked done: no verified real end-to-end Stripe payment against configured secrets/webhook delivery yet." in roadmap_text
    assert "Settlement signal" in roadmap_text
    assert "Verification status" in roadmap_text
    assert "Payment method evidence" in roadmap_text
    assert "Stripe intent persistence now also records payment-method selection evidence" in roadmap_text
    assert "run a real Stripe checkout with valid configured keys and confirm webhook delivery credits the wallet end-to-end" in roadmap_text
    assert "verify saved-card reuse on a live/test Stripe customer, not only mocked repo tests" in roadmap_text
    assert "follow `docs/STRIPE_VERIFICATION_RUNBOOK.md` and fill `docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md`" in roadmap_text
    assert "scripts/generate_stripe_verification_packet.py" in roadmap_text
    assert "only then mark this item done" in roadmap_text

    assert "| Monetization expansion | Partial |" in status_text
    assert "Stripe repo-side saved-card/webhook evidence is now stronger in both persisted payloads and the wallet UI" in status_text
    assert "docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md" in status_text
    assert "python scripts/generate_stripe_verification_packet.py" in status_text
    assert "final closure still needs a real/test webhook-confirmed top-up plus saved-card reuse run per `docs/STRIPE_VERIFICATION_RUNBOOK.md`" in status_text


def test_stripe_verification_runbook_keeps_webhook_vs_poll_truth_explicit() -> None:
    runbook_text = STRIPE_RUNBOOK.read_text(encoding="utf-8")

    assert "This runbook does **not** replace the repo tests." in runbook_text
    assert "poll fallback is not enough to close the roadmap item" in runbook_text
    assert "verified webhook delivery for a real/test Stripe checkout" in runbook_text
    assert "verified saved-card reuse on a real/test Stripe customer" in runbook_text
    assert "Settlement signal" in runbook_text
    assert "Verification status" in runbook_text
    assert "Payment method evidence" in runbook_text
    assert "docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md" in runbook_text
    assert "python scripts/generate_stripe_verification_packet.py" in runbook_text
    assert "stripe_last_event_id == \"stripe:poll\"" in runbook_text
    assert "do not close roadmap item 4.1" in runbook_text
    assert "saved card is listed through ANCAP" in runbook_text
    assert "Foreign saved payment method is rejected" in runbook_text
    assert "Only mark **4.1 Stripe / fiat payment gateway** done when both are true:" in runbook_text
    assert "new-card checkout was verified end-to-end with confirmed webhook delivery" in runbook_text
    assert "saved-card reuse was verified end-to-end on the same adapter slice" in runbook_text
    assert "save the filled packet as a dated copy of `docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md`" in runbook_text


def test_stripe_verification_evidence_template_tracks_manual_closure_requirements() -> None:
    template_text = STRIPE_EVIDENCE_TEMPLATE.read_text(encoding="utf-8")

    assert "This file is a **template**, not completed verification evidence." in template_text
    assert "Do **not** mark roadmap item `4.1 Stripe / fiat payment gateway` done" in template_text
    assert "poll fallback" in template_text
    assert "Run A — New-card checkout with webhook confirmation" in template_text
    assert "Run B — Saved-card reuse verification" in template_text
    assert "Settlement signal" in template_text
    assert "Verification status" in template_text
    assert "Payment method evidence" in template_text
    assert "Foreign saved payment method is rejected" in template_text
    assert "Final roadmap status for item 4.1: keep `[~]` / mark `[x]`" in template_text


def test_wallet_credit_ui_and_helpers_surface_settlement_and_method_evidence() -> None:
    helper_text = STRIPE_SETTLEMENT_HELPER.read_text(encoding="utf-8")
    helper_test_text = STRIPE_SETTLEMENT_TEST.read_text(encoding="utf-8")
    page_text = WALLET_CREDITS_PAGE.read_text(encoding="utf-8")

    assert 'label: "webhook"' in helper_text
    assert 'verificationLabel: "webhook delivery confirmed"' in helper_text
    assert 'label: "poll fallback"' in helper_text
    assert 'verificationLabel: "live webhook verification still open"' in helper_text
    assert 'selectionLabel: "saved card"' in helper_text
    assert 'selectionLabel: "new card"' in helper_text

    assert "marks webhook-backed settlement explicitly" in helper_test_text
    assert "marks poll fallback separately from webhook delivery" in helper_test_text
    assert "surfaces saved-card evidence from provider payload" in helper_test_text
    assert "surfaces new-card evidence from provider payload" in helper_test_text

    assert "Settlement signal: {stripeSettlement.label}" in page_text
    assert "Verification status: {stripeSettlement.verificationLabel}" in page_text
    assert "Payment method evidence: {stripePaymentMethodEvidence.selectionLabel}" in page_text
    assert "Save card for the next top-up" in page_text
    assert "Choose a saved card or enter a new card" in page_text


def test_api_regressions_cover_repo_side_stripe_verification_claims() -> None:
    api_test_text = PAYMENTS_API_TESTS.read_text(encoding="utf-8")

    assert "def test_stripe_webhook_captures_credit_topup_once" in api_test_text
    assert '"stripe_last_event_id"] == event_id' in api_test_text
    assert '"stripe_last_event_type"] == "payment_intent.succeeded"' in api_test_text
    assert '"confirm_note"] == "Stripe webhook payment confirmation"' in api_test_text
    assert "def test_stripe_poll_sync_captures_success_without_webhook" in api_test_text
    assert '"stripe_last_event_id"] == "stripe:poll"' in api_test_text
    assert '"confirm_note"] == "Stripe poll payment confirmation"' in api_test_text
    assert '"stripe_last_event_type"] == "payment_intent.succeeded"' in api_test_text
    assert "def test_stripe_poll_sync_marks_cancelled_without_webhook" in api_test_text
    assert "def test_stripe_webhook_rejects_invalid_signature" in api_test_text
    assert "def test_stripe_intent_rejects_saved_payment_method_from_another_customer" in api_test_text
    assert "def test_create_stripe_payment_intent_records_saved_method_selection_metadata" in api_test_text
    assert 'intent.provider_payload_json["payment_method_selection"] == "saved_method"' in api_test_text
    assert 'intent.provider_payload_json["requested_payment_method_id"] == "pm_saved_123"' in api_test_text
    assert "def test_create_stripe_payment_intent_records_new_card_selection_metadata" in api_test_text
    assert 'intent.provider_payload_json["payment_method_selection"] == "new_card"' in api_test_text
    assert "def test_stripe_intent_rejects_unsupported_currency" in api_test_text


def test_stripe_packet_generator_is_part_of_repo_truth_contract() -> None:
    generator_text = STRIPE_PACKET_GENERATOR.read_text(encoding="utf-8")

    assert "Generate a dated Stripe verification evidence packet" in generator_text
    assert "docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md" in generator_text
    assert "docs/stripe-verification-YYYY-MM-DD.md" in generator_text
    assert "DEFAULT_LATEST_ALIAS_LABEL = \"latest\"" in generator_text
    assert "--no-write-latest-alias" in generator_text
    assert "build_latest_alias_path" in generator_text
    assert "## Packet bootstrap metadata" in generator_text
    assert "Latest alias path" in generator_text
    assert "Generator repo HEAD" in generator_text
    assert "Reminder: this packet is prefilled scaffolding only." in generator_text

    payments_router_text = (REPO_ROOT / "app" / "api" / "routers" / "payments.py").read_text(encoding="utf-8")
    assert "Stripe poll payment confirmation" in payments_router_text
    assert "Stripe webhook payment confirmation" in payments_router_text
