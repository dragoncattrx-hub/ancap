from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SDK_SAFE_ERROR = REPO_ROOT / "ancap-mobile" / "packages" / "acp-wallet-sdk" / "src" / "safe-error.ts"
MOBILE_FILES = [
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "onboarding" / "import.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "onboarding" / "create.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "(tabs)" / "send.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "(tabs)" / "index.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "(tabs)" / "activity.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "(tabs)" / "bridge.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "(tabs)" / "settings.tsx",
    REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "smart-pay.tsx",
]
ROADMAP_FILES = [
    REPO_ROOT / "MASTER_ROADMAP.md",
    REPO_ROOT / "docs" / "mobile" / "ROADMAP.md",
]


def test_safe_error_helper_redacts_expected_secret_fields() -> None:
    content = SDK_SAFE_ERROR.read_text(encoding="utf-8")

    assert "mnemonic" in content
    assert "keystoreJson" in content
    assert "rawTx" in content
    assert "Authorization" in content
    assert "[redacted]" in content
    assert "MAX_SAFE_ERROR_MESSAGE_LENGTH" in content


def test_mobile_wallet_surfaces_use_safe_error_message() -> None:
    for path in MOBILE_FILES:
        content = path.read_text(encoding="utf-8")
        assert "safeErrorMessage" in content, f"Expected safeErrorMessage usage in {path}"


def test_mobile_security_docs_and_roadmaps_record_no_secrets_logging_slice() -> None:
    master = ROADMAP_FILES[0].read_text(encoding="utf-8")
    mobile = ROADMAP_FILES[1].read_text(encoding="utf-8")

    assert "| P5-5 | No secrets in Sentry/logs | [x]" in master
    assert "| P5-5 | No secrets in Sentry/logs | [x]" in mobile
    assert "mobile wallet error surfaces now route thrown messages through a shared secret-redacting helper" in master
    assert "wallet error surfaces now route thrown messages through a shared secret-redacting helper" in mobile
