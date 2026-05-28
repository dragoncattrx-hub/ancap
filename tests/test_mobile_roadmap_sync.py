from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MASTER = REPO_ROOT / "MASTER_ROADMAP.md"
MOBILE_ROADMAP = REPO_ROOT / "docs" / "mobile" / "ROADMAP.md"
STATUS_MATRIX = REPO_ROOT / "docs" / "STATUS_MATRIX.md"
DEVICE_MATRIX = REPO_ROOT / "docs" / "mobile" / "DEVICE_MATRIX.md"
RELEASE_CHECKLIST = REPO_ROOT / "docs" / "mobile" / "RELEASE_CHECKLIST.md"
RELEASE_RUNBOOK = REPO_ROOT / "docs" / "mobile" / "RELEASE_RUNBOOK.md"
LEGAL_PRIVACY_PAGE = REPO_ROOT / "frontend-app" / "src" / "app" / "legal" / "privacy" / "page.tsx"
LEGAL_TERMS_PAGE = REPO_ROOT / "frontend-app" / "src" / "app" / "legal" / "terms" / "page.tsx"
LEGAL_COOKIES_PAGE = REPO_ROOT / "frontend-app" / "src" / "app" / "legal" / "cookies" / "page.tsx"
MOBILE_README = REPO_ROOT / "ancap-mobile" / "README.md"


def test_master_mobile_i18n_status_matches_mobile_roadmap() -> None:
    master = MASTER.read_text(encoding="utf-8")
    mobile = MOBILE_ROADMAP.read_text(encoding="utf-8")

    assert "| P4-15 | i18n EN/RU/UK/DE | [x]" in master
    assert "react-i18next wired in the Expo app with persisted language selection" in master
    assert "| P4-15 | i18n EN/RU/UK/DE | [x]" in mobile


def test_master_execution_order_no_longer_lists_mobile_i18n_as_open() -> None:
    master = MASTER.read_text(encoding="utf-8")

    assert "5.1  i18n EN/RU/UK/DE (i18next)" not in master


def test_status_matrix_mobile_remaining_work_matches_mobile_roadmap_truth() -> None:
    status_matrix = STATUS_MATRIX.read_text(encoding="utf-8")

    assert "- remaining MASVS/device-release verification (repo baseline is closed; real-device/native validation still remains)" in status_matrix
    assert "- MASVS L1 checklist closure" not in status_matrix
    assert "- MASVS L1 and logging-secret hygiene" not in status_matrix


def test_master_and_mobile_roadmaps_mark_masvs_as_in_progress_with_repo_baseline_closed() -> None:
    master = MASTER.read_text(encoding="utf-8")
    mobile = MOBILE_ROADMAP.read_text(encoding="utf-8")

    expected = "| P5-1 | MASVS L1 checklist | [~] repo-baseline closed in `docs/mobile/SECURITY_MODEL.md`"
    assert expected in master
    assert "| P5-1 | OWASP MASVS L1 checklist | [~] | repo-baseline closed in `docs/mobile/SECURITY_MODEL.md`" in mobile


def test_mobile_release_closure_docs_exist_and_cover_current_truth() -> None:
    device_matrix = DEVICE_MATRIX.read_text(encoding="utf-8")
    release_checklist = RELEASE_CHECKLIST.read_text(encoding="utf-8")
    release_runbook = RELEASE_RUNBOOK.read_text(encoding="utf-8")

    assert DEVICE_MATRIX.exists()
    assert RELEASE_CHECKLIST.exists()
    assert RELEASE_RUNBOOK.exists()
    assert "These runs have **not** been executed yet from this repo state." in device_matrix
    assert "Android NDK" in device_matrix
    assert "macOS + Xcode" in device_matrix
    assert "TestFlight" in release_checklist
    assert "Play Console Internal testing" in release_checklist
    assert "/legal/terms" in release_checklist
    assert "/legal/privacy" in release_checklist
    assert "/legal/cookies" in release_checklist
    assert "v1.0.0 Release Runbook" in release_runbook
    assert "Release notes convention" in release_runbook
    assert "Rollback plan" in release_runbook


def test_release_closure_status_is_in_sync_across_master_mobile_and_status_matrix() -> None:
    master = MASTER.read_text(encoding="utf-8")
    mobile = MOBILE_ROADMAP.read_text(encoding="utf-8")
    status_matrix = STATUS_MATRIX.read_text(encoding="utf-8")

    assert "| P6-3 | Device matrix (iOS + Android) | [~] matrix/checklist doc added in `docs/mobile/DEVICE_MATRIX.md`; real device runs still pending |" in master
    assert "| P6-3 | Device matrix (iOS + Android) | [~] | execution matrix/checklist now lives in `docs/mobile/DEVICE_MATRIX.md`; real device runs still pending |" in mobile
    assert "| P6-4 | TestFlight + Play Internal | [~] release-readiness checklist added in `docs/mobile/RELEASE_CHECKLIST.md`; real uploads still pending |" in master
    assert "| P6-4 | TestFlight + Play Internal | [~] | release-readiness checklist now lives in `docs/mobile/RELEASE_CHECKLIST.md`; real uploads still pending |" in mobile
    assert "| P6-5 | Store listing + legal pages | [~] legal routes exist and release pack is outlined in `docs/mobile/RELEASE_CHECKLIST.md`; final operator/assets review still pending |" in master
    assert "| P6-5 | App Store / Play listing + legal pages | [~] | legal web routes exist and release pack is outlined in `docs/mobile/RELEASE_CHECKLIST.md`; final operator/assets review still pending |" in mobile
    assert "| P6-6 | Production v1.0.0 | [~] final release gate is now scaffolded in `docs/mobile/RELEASE_RUNBOOK.md`; real native/device/store execution still pending |" in master
    assert "| P6-6 | Production v1.0.0 | [~] | final release gate is now scaffolded in `docs/mobile/RELEASE_RUNBOOK.md`; real native/device/store execution still pending |" in mobile
    assert "release-closure scaffolding now exists in `docs/mobile/DEVICE_MATRIX.md`, `docs/mobile/RELEASE_CHECKLIST.md`, and `docs/mobile/RELEASE_RUNBOOK.md`" in status_matrix
    assert "public legal page routes already exist for `/legal/terms`, `/legal/privacy`, and `/legal/cookies`" in status_matrix


def test_release_checklist_claimed_legal_routes_exist_in_frontend() -> None:
    assert LEGAL_PRIVACY_PAGE.exists()
    assert LEGAL_TERMS_PAGE.exists()
    assert LEGAL_COOKIES_PAGE.exists()


def test_mobile_readme_links_release_closure_docs() -> None:
    readme = MOBILE_README.read_text(encoding="utf-8")

    assert "../docs/mobile/DEVICE_MATRIX.md" in readme
    assert "../docs/mobile/RELEASE_CHECKLIST.md" in readme
    assert "../docs/mobile/RELEASE_RUNBOOK.md" in readme


def test_smart_pay_groundwork_truth_is_in_sync_with_mobile_repo_state() -> None:
    master = MASTER.read_text(encoding="utf-8")
    mobile = MOBILE_ROADMAP.read_text(encoding="utf-8")
    status_matrix = STATUS_MATRIX.read_text(encoding="utf-8")

    assert "| SQ-3 | Quote engine groundwork | [x] | backend `POST /v1/mobile/smart-pay/quote` slice exists with first-scope direct-send and ACP→wACP→USDT route quoting, fee/slippage checks, and API tests |" in mobile
    assert "| SQ-4 | Execution session groundwork | [x] | backend execute/status/recover endpoints exist with first execution-state lifecycle and API tests |" in mobile
    assert "| SQ-5 | Mobile SDK/client wiring | [x] | `@ancap/acp-api-client` has typed Smart Pay capabilities/parse/quote/execute/status/recover methods with client tests |" in mobile
    assert "| SQ-6 | Expo scan/import/pay UX | [~] | Smart Pay beta screen now supports paste, gallery QR import, camera QR scan, explicit confirmation before execute, refresh/recover, and persisted draft/session restore in-device; polished UX/history and real route execution still pending |" in mobile
    assert "| SQ-7 | Real route execution integration | [ ] | blocked on local non-custodial EVM spend/sign closure plus bridge/swap/transfer orchestration beyond placeholder routes |" in mobile
    assert "| SQ-9 | Receipt/history/recovery UX | [~] | Expo beta now persists recent device-local Smart Pay session snapshots, supports tap-to-resume, and renders a local receipt summary from intent/quote/execution data; backend-backed payment history and richer receipt polish still pending |" in mobile
    assert "backend `capabilities` + deterministic `parse` + `quote` + execute/status/recover endpoints exist in repo code with API tests" in master
    assert "typed mobile client methods exist with client tests" in master
    assert "Expo beta flow already supports paste, QR import, camera scan, review, execute, refresh/recover, and session restore" in master
    assert "Expo beta now persists recent device-local Smart Pay session snapshots, supports tap-to-resume, and renders a local receipt summary from intent/quote/execution data" in master
    assert "real route engine / bridge-swap execution integration (still blocked on local non-custodial EVM spend/sign closure plus backend route orchestration beyond placeholder sessions)" in master
    assert "Smart Pay first-scope backend groundwork exists for capabilities, deterministic parse, quote, and execute/status/recover" in status_matrix
    assert "Smart Pay typed client wiring and Expo beta flow already exist for parse → quote → execute → refresh/recover" in status_matrix
    assert "Smart Pay Expo beta now also keeps recent device-local session/receipt snapshots for resume/history/recovery baseline UX" in status_matrix
