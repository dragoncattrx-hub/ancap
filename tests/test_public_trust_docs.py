from pathlib import Path


README_PATH = Path("README.md")
OPEN_SOURCE_DOC_PATH = Path("docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md")
ROADMAP_PATH = Path("MASTER_ROADMAP.md")

BRIDGE_RISK_DOC = Path("docs/BRIDGE_RISK_DOCUMENTATION.md")
CONTRACT_VERIFICATION_DOC = Path("docs/CONTRACT_VERIFICATION_GUIDE.md")
TESTNET_DEPLOYMENT_DOC = Path("docs/TESTNET_DEPLOYMENT_GUIDE.md")
AUDIT_CHECKLIST_DOC = Path("docs/AUDIT_CHECKLIST.md")
PUBLIC_CHANGELOG_DOC = Path("docs/CHANGELOG_PUBLIC.md")


def test_public_trust_docs_exist_and_are_linked_from_readme():
    readme_text = README_PATH.read_text(encoding="utf-8")

    for path in [
        BRIDGE_RISK_DOC,
        CONTRACT_VERIFICATION_DOC,
        TESTNET_DEPLOYMENT_DOC,
        AUDIT_CHECKLIST_DOC,
        PUBLIC_CHANGELOG_DOC,
    ]:
        assert path.exists(), f"missing doc: {path}"

    assert "docs/BRIDGE_RISK_DOCUMENTATION.md" in readme_text
    assert "docs/CONTRACT_VERIFICATION_GUIDE.md" in readme_text
    assert "docs/TESTNET_DEPLOYMENT_GUIDE.md" in readme_text
    assert "docs/AUDIT_CHECKLIST.md" in readme_text
    assert "docs/CHANGELOG_PUBLIC.md" in readme_text


def test_open_source_transparency_doc_points_to_public_trust_docs():
    doc_text = OPEN_SOURCE_DOC_PATH.read_text(encoding="utf-8")

    assert "docs/BRIDGE_RISK_DOCUMENTATION.md" in doc_text
    assert "docs/CONTRACT_VERIFICATION_GUIDE.md" in doc_text
    assert "docs/TESTNET_DEPLOYMENT_GUIDE.md" in doc_text
    assert "docs/AUDIT_CHECKLIST.md" in doc_text
    assert "docs/CHANGELOG_PUBLIC.md" in doc_text


def test_master_roadmap_marks_documented_sprint3_items_done():
    roadmap_text = ROADMAP_PATH.read_text(encoding="utf-8")

    assert "- [x] Add bridge risk documentation" in roadmap_text
    assert "- [x] Add contract verification guide" in roadmap_text
    assert "- [x] Add public changelog" in roadmap_text
    assert "- [x] Add release tags" in roadmap_text
    assert "- [x] Add testnet deployment guide" in roadmap_text
    assert "- [x] Add audit checklist" in roadmap_text
