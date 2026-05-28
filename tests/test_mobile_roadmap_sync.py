from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MASTER = REPO_ROOT / "MASTER_ROADMAP.md"
MOBILE_ROADMAP = REPO_ROOT / "docs" / "mobile" / "ROADMAP.md"
STATUS_MATRIX = REPO_ROOT / "docs" / "STATUS_MATRIX.md"


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
