from __future__ import annotations

import importlib.util
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEVICE_SCRIPT_PATH = REPO_ROOT / "scripts" / "generate_mobile_device_verification_packet.py"
RELEASE_SCRIPT_PATH = REPO_ROOT / "scripts" / "generate_mobile_release_evidence_packet.py"
DEVICE_TEMPLATE_PATH = REPO_ROOT / "docs" / "mobile" / "DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md"
RELEASE_TEMPLATE_PATH = REPO_ROOT / "docs" / "mobile" / "RELEASE_EVIDENCE_PACKET_TEMPLATE.md"


def load_module(path: Path, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_device_generator_build_paths_and_latest_alias_suffix():
    module = load_module(DEVICE_SCRIPT_PATH, "generate_mobile_device_verification_packet")

    output_path = module.build_output_path(
        output_dir=Path("docs/mobile"),
        basename="device-evidence",
        date_label="2026-06-02",
    )
    latest_alias_path = module.build_latest_alias_path(
        output_dir=Path("docs/mobile"),
        basename="device-evidence",
    )

    assert output_path == Path("docs/mobile/device-evidence-2026-06-02.md")
    assert latest_alias_path == Path("docs/mobile/device-evidence-latest.md")


def test_release_generator_default_basename_and_latest_alias_suffix():
    module = load_module(RELEASE_SCRIPT_PATH, "generate_mobile_release_evidence_packet")

    assert module.build_default_basename(app_version="1.0.0") == "release-evidence-v1.0.0"
    output_path = module.build_output_path(
        output_dir=Path("docs/mobile"),
        basename="release-evidence-v1.0.0",
        date_label="2026-06-02",
    )
    latest_alias_path = module.build_latest_alias_path(
        output_dir=Path("docs/mobile"),
        basename="release-evidence-v1.0.0",
    )

    assert output_path == Path("docs/mobile/release-evidence-v1.0.0-2026-06-02.md")
    assert latest_alias_path == Path("docs/mobile/release-evidence-v1.0.0-latest.md")


def test_mobile_packet_generators_reject_invalid_filename_components():
    for path, module_name in [
        (DEVICE_SCRIPT_PATH, "generate_mobile_device_verification_packet_invalid"),
        (RELEASE_SCRIPT_PATH, "generate_mobile_release_evidence_packet_invalid"),
    ]:
        module = load_module(path, module_name)
        for value in ["nested/path", r"nested\\path", ".", ".."]:
            try:
                module._validate_filename_component(value, flag_name="--basename")
            except ValueError as exc:
                message = str(exc)
            else:
                raise AssertionError(f"expected filename-component validation to fail for {value!r}")

            assert "filename component only" in message or "must not be '.' or '..'" in message


def test_device_packet_render_prefills_metadata_and_bootstrap_appendix():
    module = load_module(DEVICE_SCRIPT_PATH, "generate_mobile_device_verification_packet_render")
    template_text = DEVICE_TEMPLATE_PATH.read_text(encoding="utf-8")
    output_path = REPO_ROOT / "docs" / "mobile" / "device-evidence-2026-06-02.md"

    rendered = module.render_packet(
        template_text,
        generated_at_utc="2026-06-02T06:50:00Z",
        template_path=DEVICE_TEMPLATE_PATH,
        output_path=output_path,
        operator="ARDO",
        verification_date="2026-06-02",
        commit_sha="abc123",
        app_version="1.0.0",
        android_build_number="42",
        ios_build_number="17",
        backend_api_target="http://127.0.0.1:8001/v1",
        auth_config_notes="dev bearer header present",
        android_artifacts="ancap-mobile/modules/expo-acp-core/android/src/main/jniLibs",
        ios_artifacts="ancap-mobile/modules/expo-acp-core/ios/native/acp_mobile_ffiFFI.xcframework",
        latest_alias_path=REPO_ROOT / "docs" / "mobile" / "device-evidence-latest.md",
    )

    assert "- Date: 2026-06-02" in rendered
    assert "- Operator: ARDO" in rendered
    assert "- Commit SHA: abc123" in rendered
    assert "- App version: 1.0.0" in rendered
    assert "- Android build number: 42" in rendered
    assert "- iOS build number: 17" in rendered
    assert "- Backend/API target: http://127.0.0.1:8001/v1" in rendered
    assert "- Auth/config notes: dev bearer header present" in rendered
    assert "  - Android `.so` artifacts: ancap-mobile/modules/expo-acp-core/android/src/main/jniLibs" in rendered
    assert "  - iOS packaged artifacts / xcframework: ancap-mobile/modules/expo-acp-core/ios/native/acp_mobile_ffiFFI.xcframework" in rendered
    assert "## Packet bootstrap metadata" in rendered
    assert "- Generated at (UTC): `2026-06-02T06:50:00Z`" in rendered
    assert "- Source template: `docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md`" in rendered
    assert "- Output path: `docs/mobile/device-evidence-2026-06-02.md`" in rendered
    assert "- Latest alias path: `docs/mobile/device-evidence-latest.md`" in rendered
    assert "- Generator: `scripts/generate_mobile_device_verification_packet.py`" in rendered
    assert "- App name: `ANCAP ACP Wallet`" in rendered
    assert "- iOS bundle ID: `cloud.ancap.acpwallet`" in rendered
    assert "- Android package: `cloud.ancap.acpwallet`" in rendered
    assert "- URL scheme: `acpwallet`" in rendered
    assert "Keep roadmap item `P6-3 Device matrix (iOS + Android)` open" in rendered


def test_release_packet_render_prefills_metadata_and_bootstrap_appendix():
    module = load_module(RELEASE_SCRIPT_PATH, "generate_mobile_release_evidence_packet_render")
    template_text = RELEASE_TEMPLATE_PATH.read_text(encoding="utf-8")
    output_path = REPO_ROOT / "docs" / "mobile" / "release-evidence-v1.0.0-2026-06-02.md"

    rendered = module.render_packet(
        template_text,
        generated_at_utc="2026-06-02T06:55:00Z",
        template_path=RELEASE_TEMPLATE_PATH,
        output_path=output_path,
        target_version="1.0.0",
        target_commit_sha="def456",
        tag_or_release_branch="release/mobile-v1.0.0",
        operator="ARDO",
        release_date="2026-06-02",
        release_scope_summary="ACP wallet v1.0.0 RC evidence scaffold",
        android_build_number="77",
        ios_build_number="21",
        android_so_artifact_source="ancap-mobile/modules/expo-acp-core/android/src/main/jniLibs",
        android_release_candidate_artifact_path="artifacts/android/acp-wallet-rc.apk",
        ios_packaged_artifact_path="ancap-mobile/modules/expo-acp-core/ios/native/acp_mobile_ffiFFI.xcframework",
        ios_release_candidate_artifact_path="artifacts/ios/acp-wallet-rc.ipa",
        signing_profile_notes="awaiting store signing",
        primary_device_evidence_file="docs/mobile/device-evidence-latest.md",
        additional_device_evidence_files="docs/mobile/device-evidence-ios-rc1.md",
        latest_alias_path=REPO_ROOT / "docs" / "mobile" / "release-evidence-v1.0.0-latest.md",
    )

    assert "- Target version: 1.0.0" in rendered
    assert "- Target commit SHA: def456" in rendered
    assert "- Tag / release branch: release/mobile-v1.0.0" in rendered
    assert "- Operator: ARDO" in rendered
    assert "- Date: 2026-06-02" in rendered
    assert "- Release scope summary: ACP wallet v1.0.0 RC evidence scaffold" in rendered
    assert "- App version: 1.0.0" in rendered
    assert "- Android versionCode / build number: 77" in rendered
    assert "- iOS build number: 21" in rendered
    assert "- Android `.so` artifact source/path: ancap-mobile/modules/expo-acp-core/android/src/main/jniLibs" in rendered
    assert "- Android release candidate artifact path: artifacts/android/acp-wallet-rc.apk" in rendered
    assert "- iOS packaged artifact / xcframework path: ancap-mobile/modules/expo-acp-core/ios/native/acp_mobile_ffiFFI.xcframework" in rendered
    assert "- iOS release candidate artifact path: artifacts/ios/acp-wallet-rc.ipa" in rendered
    assert "- Any signing/profile notes: awaiting store signing" in rendered
    assert "- Primary device evidence file: docs/mobile/device-evidence-latest.md" in rendered
    assert "- Additional device evidence file(s): docs/mobile/device-evidence-ios-rc1.md" in rendered
    assert "## Packet bootstrap metadata" in rendered
    assert "- Generated at (UTC): `2026-06-02T06:55:00Z`" in rendered
    assert "- Source template: `docs/mobile/RELEASE_EVIDENCE_PACKET_TEMPLATE.md`" in rendered
    assert "- Output path: `docs/mobile/release-evidence-v1.0.0-2026-06-02.md`" in rendered
    assert "- Latest alias path: `docs/mobile/release-evidence-v1.0.0-latest.md`" in rendered
    assert "- Generator: `scripts/generate_mobile_release_evidence_packet.py`" in rendered
    assert "- App name: `ANCAP ACP Wallet`" in rendered
    assert "Keep roadmap items `P6-4 TestFlight + Play Internal` and `P6-6 Production v1.0.0` open" in rendered


def test_device_generator_cli_creates_dated_packet_and_latest_alias(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(DEVICE_SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-02",
            "--operator",
            "ARDO",
            "--verification-date",
            "2026-06-02",
            "--android-build-number",
            "42",
            "--ios-build-number",
            "17",
            "--backend-api-target",
            "http://127.0.0.1:8001/v1",
            "--auth-config-notes",
            "dev bearer header present",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    output_path = tmp_path / "device-evidence-2026-06-02.md"
    latest_alias_path = tmp_path / "device-evidence-latest.md"
    assert output_path.exists()
    assert latest_alias_path.exists()
    text = output_path.read_text(encoding="utf-8")
    latest_text = latest_alias_path.read_text(encoding="utf-8")
    assert "- Operator: ARDO" in text
    assert "- Android build number: 42" in text
    assert "- iOS build number: 17" in text
    assert "- Backend/API target: http://127.0.0.1:8001/v1" in text
    assert "## Packet bootstrap metadata" in text
    assert "- Latest alias path: `" in text
    assert latest_text == text
    stdout = result.stdout.replace("\\", "/")
    assert str(output_path).replace("\\", "/") in stdout
    assert str(latest_alias_path).replace("\\", "/") in stdout
    assert "Reminder: fill required Android/iOS run rows" in result.stdout


def test_release_generator_cli_creates_dated_packet_and_latest_alias(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(RELEASE_SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-02",
            "--operator",
            "ARDO",
            "--tag-or-release-branch",
            "release/mobile-v1.0.0",
            "--android-build-number",
            "77",
            "--ios-build-number",
            "21",
            "--release-scope-summary",
            "ACP wallet v1.0.0 RC evidence scaffold",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    output_path = tmp_path / "release-evidence-v1.0.0-2026-06-02.md"
    latest_alias_path = tmp_path / "release-evidence-v1.0.0-latest.md"
    assert output_path.exists()
    assert latest_alias_path.exists()
    text = output_path.read_text(encoding="utf-8")
    latest_text = latest_alias_path.read_text(encoding="utf-8")
    assert "- Operator: ARDO" in text
    assert "- Tag / release branch: release/mobile-v1.0.0" in text
    assert "- Android versionCode / build number: 77" in text
    assert "- iOS build number: 21" in text
    assert "- Release scope summary: ACP wallet v1.0.0 RC evidence scaffold" in text
    assert "## Packet bootstrap metadata" in text
    assert "- Latest alias path: `" in text
    assert latest_text == text
    stdout = result.stdout.replace("\\", "/")
    assert str(output_path).replace("\\", "/") in stdout
    assert str(latest_alias_path).replace("\\", "/") in stdout
    assert "Reminder: fill real device/build/upload evidence" in result.stdout


def test_mobile_generators_can_skip_latest_alias_write(tmp_path: Path):
    device_result = subprocess.run(
        [
            sys.executable,
            str(DEVICE_SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-02",
            "--no-write-latest-alias",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    release_result = subprocess.run(
        [
            sys.executable,
            str(RELEASE_SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-03",
            "--no-write-latest-alias",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert device_result.returncode == 0, device_result.stderr or device_result.stdout
    assert release_result.returncode == 0, release_result.stderr or release_result.stdout
    device_output = tmp_path / "device-evidence-2026-06-02.md"
    release_output = tmp_path / "release-evidence-v1.0.0-2026-06-03.md"
    assert device_output.exists()
    assert release_output.exists()
    assert "Latest alias path: not written (`--no-write-latest-alias`)" in device_output.read_text(encoding="utf-8")
    assert "Latest alias path: not written (`--no-write-latest-alias`)" in release_output.read_text(encoding="utf-8")


def test_mobile_generators_reject_reserved_latest_date_label(tmp_path: Path):
    for script_path in [DEVICE_SCRIPT_PATH, RELEASE_SCRIPT_PATH]:
        result = subprocess.run(
            [
                sys.executable,
                str(script_path),
                "--output-dir",
                str(tmp_path),
                "--date-label",
                "latest",
            ],
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        assert result.returncode != 0
        assert "--date-label latest is reserved for the stable latest alias" in (result.stderr or result.stdout)


def test_mobile_generators_refuse_to_overwrite_existing_packet(tmp_path: Path):
    device_output = tmp_path / "device-evidence-2026-06-02.md"
    device_output.write_text("existing\n", encoding="utf-8")
    release_output = tmp_path / "release-evidence-v1.0.0-2026-06-02.md"
    release_output.write_text("existing\n", encoding="utf-8")

    device_result = subprocess.run(
        [
            sys.executable,
            str(DEVICE_SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-02",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    release_result = subprocess.run(
        [
            sys.executable,
            str(RELEASE_SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-02",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert device_result.returncode != 0
    assert release_result.returncode != 0
    assert "Refusing to overwrite existing packet" in (device_result.stderr or device_result.stdout)
    assert "Refusing to overwrite existing packet" in (release_result.stderr or release_result.stdout)


def test_mobile_generators_reject_invalid_date_label(tmp_path: Path):
    for script_path in [DEVICE_SCRIPT_PATH, RELEASE_SCRIPT_PATH]:
        result = subprocess.run(
            [
                sys.executable,
                str(script_path),
                "--output-dir",
                str(tmp_path),
                "--date-label",
                "nested/path",
            ],
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        assert result.returncode != 0
        assert "--date-label must be a filename component only" in (result.stderr or result.stdout)
