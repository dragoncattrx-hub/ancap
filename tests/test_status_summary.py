from pathlib import Path


STATUS_PATH = Path("STATUS.md")


def test_status_summary_keeps_ancap_docs_live_followup_truth_explicit():
    status_text = STATUS_PATH.read_text(encoding="utf-8")

    assert "https://github.com/dragoncattrx-hub/ancap-docs" in status_text
    assert "scripts/generate_ancap_docs_live_followup.py" in status_text
    assert "tmp/ancap-docs-live-follow-up-latest.md" in status_text
    assert "tmp/ancap-docs-live-follow-up-latest.json" in status_text
    assert "filename components instead of path fragments" in status_text
    assert "--fail-on-not-ok" in status_text
    assert "exit code `2`" in status_text or "exits with code `2`" in status_text
    assert "General` / `Polls`" in status_text
    assert "Announcements` / `Ideas` / `Q&A` / `Show and tell`" in status_text
    assert "read:project" in status_text
    assert "pinning" in status_text or "pinning," in status_text
