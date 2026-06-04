from pathlib import Path


README_PATH = Path("README.md")
OPEN_SOURCE_DOC_PATH = Path("docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md")
EXAMPLES_INDEX_DOC_PATH = Path("docs/PUBLIC_INTEGRATION_EXAMPLES.md")
EXAMPLES_README_PATH = Path("examples/README.md")
PAYMENT_EXAMPLE_PATH = Path("examples/payment-integration/python_credit_topup.py")
WALLET_EXAMPLE_PATH = Path("examples/wallet-connection/python_wallet_login.py")
WACP_SOURCE_PATH = Path("contracts/bridge-bsc/src/WACP.sol")
BRIDGE_GATEWAY_SOURCE_PATH = Path("contracts/bridge-bsc/src/BridgeGateway.sol")


def test_public_examples_exist_and_are_linked_from_readme():
    readme_text = README_PATH.read_text(encoding="utf-8")

    assert EXAMPLES_INDEX_DOC_PATH.exists()
    assert EXAMPLES_README_PATH.exists()
    assert PAYMENT_EXAMPLE_PATH.exists()
    assert WALLET_EXAMPLE_PATH.exists()
    assert "## Public integration examples" in readme_text
    assert "docs/PUBLIC_INTEGRATION_EXAMPLES.md" in readme_text
    assert "examples/payment-integration/python_credit_topup.py" in readme_text
    assert "examples/wallet-connection/python_wallet_login.py" in readme_text


def test_open_source_doc_points_to_publishable_examples_and_contracts():
    doc_text = OPEN_SOURCE_DOC_PATH.read_text(encoding="utf-8")
    examples_index_text = EXAMPLES_INDEX_DOC_PATH.read_text(encoding="utf-8")

    assert "docs/PUBLIC_INTEGRATION_EXAMPLES.md" in doc_text
    assert "examples/payment-integration/python_credit_topup.py" in doc_text
    assert "examples/wallet-connection/python_wallet_login.py" in doc_text
    assert "contracts/bridge-bsc/src/WACP.sol" in doc_text
    assert "contracts/bridge-bsc/src/BridgeGateway.sol" in doc_text
    assert "examples/payment-integration/python_credit_topup.py" in examples_index_text
    assert "examples/wallet-connection/python_wallet_login.py" in examples_index_text
    assert "contracts/bridge-bsc/src/WACP.sol" in examples_index_text
    assert "contracts/bridge-bsc/src/BridgeGateway.sol" in examples_index_text


def test_public_wacp_contract_sources_exist_and_readme_links_them():
    readme_text = README_PATH.read_text(encoding="utf-8")

    assert WACP_SOURCE_PATH.exists()
    assert BRIDGE_GATEWAY_SOURCE_PATH.exists()
    assert "## wACP public contract source" in readme_text
    assert "contracts/bridge-bsc/src/WACP.sol" in readme_text
    assert "contracts/bridge-bsc/src/BridgeGateway.sol" in readme_text
