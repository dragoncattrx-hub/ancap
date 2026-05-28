from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_SECURITY_PAGE = REPO_ROOT / "frontend-app" / "src" / "app" / "docs" / "mobile" / "security" / "page.tsx"
MOBILE_API_DOC = REPO_ROOT / "docs" / "mobile" / "API_MOBILE.md"
MOBILE_API_CLIENT_TEST = REPO_ROOT / "ancap-mobile" / "packages" / "acp-api-client" / "src" / "client.test.ts"
EXPO_SETTINGS_SCREEN = REPO_ROOT / "ancap-mobile" / "apps" / "acp-wallet-expo" / "app" / "(tabs)" / "settings.tsx"
MOBILE_ROUTER = REPO_ROOT / "app" / "api" / "routers" / "mobile_acp.py"


def test_mobile_security_public_page_exists_and_states_release_truth() -> None:
    text = MOBILE_SECURITY_PAGE.read_text(encoding="utf-8")

    assert MOBILE_SECURITY_PAGE.exists()
    assert "ACP Wallet security model" in text
    assert "repo baseline for the main MASVS-L1-relevant controls is in place" in text
    assert "real-device and native-build verification is finished" in text


def test_mobile_api_contract_docs_use_live_public_docs_routes() -> None:
    text = MOBILE_API_DOC.read_text(encoding="utf-8")

    assert '"bridge": "https://ancap.cloud/docs/wacp/bridge"' in text
    assert '"risks": "https://ancap.cloud/docs/wacp/risks"' in text
    assert '"reserve": "https://ancap.cloud/docs/wacp/reserve"' in text
    assert '"contracts": "https://ancap.cloud/docs/wacp/contracts"' in text
    assert '"walletSecurity": "https://ancap.cloud/docs/mobile/security"' in text


def test_mobile_api_client_contract_fixture_matches_router_docs_routes() -> None:
    client_test = MOBILE_API_CLIENT_TEST.read_text(encoding="utf-8")
    router_text = MOBILE_ROUTER.read_text(encoding="utf-8")

    assert 'bridge: "https://ancap.cloud/docs/wacp/bridge"' in client_test
    assert 'risks: "https://ancap.cloud/docs/wacp/risks"' in client_test
    assert 'reserve: "https://ancap.cloud/docs/wacp/reserve"' in client_test
    assert 'contracts: "https://ancap.cloud/docs/wacp/contracts"' in client_test
    assert 'walletSecurity: "https://ancap.cloud/docs/mobile/security"' in client_test

    assert 'bridge=f"{base}/docs/wacp/bridge"' in router_text
    assert 'risks=f"{base}/docs/wacp/risks"' in router_text
    assert 'reserve=f"{base}/docs/wacp/reserve"' in router_text
    assert 'contracts=f"{base}/docs/wacp/contracts"' in router_text
    assert 'wallet_security=f"{base}/docs/mobile/security"' in router_text


def test_expo_settings_links_match_public_docs_routes() -> None:
    text = EXPO_SETTINGS_SCREEN.read_text(encoding="utf-8")

    assert 'url: `${BASE}/docs/wacp/risks`' in text
    assert 'url: `${BASE}/docs/wacp/bridge`' in text
    assert 'url: `${BASE}/docs/wacp/reserve`' in text
