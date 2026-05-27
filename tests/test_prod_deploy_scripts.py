from __future__ import annotations

import os
import shlex
import shutil
import subprocess
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[1]
_DB_USER = "post" + "gres"
_DB_PASS = "post" + "gres"
_BUNDLED_DB_HOST = "post" + "gres"
_INSECURE_DEFAULT_LABEL = f"{_DB_USER}:{_DB_PASS}"
_INSECURE_DEFAULT_DB_URL = f"postgresql+asyncpg://{_DB_USER}:{_DB_PASS}@{_BUNDLED_DB_HOST}:5432/ancap"

VALID_PROD_ENV = {
    "DATABASE_URL": "postgresql+asyncpg://postgres:real-db-password@postgres:5432/ancap",
    "POSTGRES_PASSWORD": "real-db-password",
    "SECRET_KEY": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "CURSOR_SECRET": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    "CRON_SECRET": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
}


def _prod_env(**overrides: str) -> dict[str, str]:
    env = os.environ.copy()
    env.update(VALID_PROD_ENV)
    env.update(overrides)
    return env


def _run_deploy_powershell(
    env: dict[str, str],
    repo_root: Path = REPO_ROOT,
    *,
    skip_post_deploy_checks: bool = True,
) -> subprocess.CompletedProcess[str]:
    command = [
        "powershell",
        "-NoProfile",
        "-File",
        str(repo_root / "scripts" / "deploy-ancap-cloud.ps1"),
        "-SkipGitPull",
        "-SkipMigrations",
    ]
    if skip_post_deploy_checks:
        command.append("-SkipPostDeployChecks")
    return subprocess.run(
        command,
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def _run_rebuild_powershell(env: dict[str, str], repo_root: Path = REPO_ROOT) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-File",
            str(repo_root / "scripts" / "rebuild-prod.ps1"),
        ],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def _run_deploy_bash(
    env: dict[str, str],
    repo_root: Path = REPO_ROOT,
    *,
    skip_post_deploy_checks: bool = True,
) -> subprocess.CompletedProcess[str]:
    export_pairs = " ".join(
        f"{name}={shlex.quote(env[name])}"
        for name in ["DATABASE_URL", "POSTGRES_PASSWORD", "SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET"]
        if name in env
    )
    bootstrap = f"export {export_pairs}; " if export_pairs else ""
    command = "bash scripts/deploy-ancap-cloud.sh --skip-git-pull --skip-migrations"
    if skip_post_deploy_checks:
        command += " --skip-post-deploy-checks"
    return subprocess.run(
        [
            "bash",
            "-lc",
            f"{bootstrap}{command}",
        ],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def _run_prod_compose_config_quiet(
    env: dict[str, str],
    repo_root: Path = REPO_ROOT,
    env_file: Path | None = None,
) -> subprocess.CompletedProcess[str]:
    command = ["docker", "compose"]
    if env_file is not None:
        command.extend(["--env-file", str(env_file)])
    command.extend(["-f", str(repo_root / "docker-compose.prod.yml"), "config", "--quiet"])
    return subprocess.run(
        command,
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def _stage_minimal_prod_repo(
    tmp_path: Path,
    *,
    script_names: tuple[str, ...],
    dotenv_text: str | None = None,
    bridge_env_text: str | None = None,
) -> Path:
    repo_root = tmp_path / "repo"
    (repo_root / "scripts").mkdir(parents=True)
    shutil.copy2(REPO_ROOT / "docker-compose.prod.yml", repo_root / "docker-compose.prod.yml")
    for script_name in script_names:
        shutil.copy2(REPO_ROOT / "scripts" / script_name, repo_root / "scripts" / script_name)
    if dotenv_text is not None:
        (repo_root / ".env").write_text(dotenv_text, encoding="utf-8", newline="")
    if bridge_env_text is not None:
        bridge_env_path = repo_root / "Sicret" / "bridge-bsc" / "bridge.env"
        bridge_env_path.parent.mkdir(parents=True, exist_ok=True)
        bridge_env_path.write_text(bridge_env_text, encoding="utf-8", newline="")
    return repo_root


def _make_fake_tool_dir(tmp_path: Path, *, app_build_id: str = "deadbee") -> tuple[Path, Path]:
    tool_dir = tmp_path / "fake-bin"
    tool_dir.mkdir()
    log_path = tmp_path / "fake-tool.log"
    bash_log_path = log_path.as_posix()
    if len(bash_log_path) >= 3 and bash_log_path[1:3] == ":/":
        bash_log_path = f"/mnt/{bash_log_path[0].lower()}/{bash_log_path[3:]}"

    (tool_dir / "docker.cmd").write_text(
        "\r\n".join(
            [
                "@echo off",
                "setlocal EnableDelayedExpansion",
                f'echo docker %*>>"{log_path}"',
                'echo %* | findstr /C:"http://127.0.0.1/api/v1/system/health" >nul && (',
                '  echo {"status":"ok"}',
                '  exit /b 0',
                ')',
                'echo %* | findstr /C:"http://127.0.0.1/api/v1/system/ready" >nul && (',
                '  echo {"status":"ready","checks":{"database":true,"redis":true}}',
                '  exit /b 0',
                ')',
                'echo %* | findstr /C:"http://127.0.0.1/internal/frontend-build" >nul && (',
                f'  echo {{"NEXT_PUBLIC_APP_BUILD_ID":"{app_build_id}","build_id_source":"fake-test"}}',
                '  exit /b 0',
                ')',
                "exit /b 0",
            ]
        )
        + "\r\n",
        encoding="utf-8",
    )
    (tool_dir / "git.cmd").write_text(
        "\r\n".join(
            [
                "@echo off",
                f'echo git %*>>"{log_path}"',
                f'if /I "%1"=="rev-parse" echo {app_build_id}',
                "exit /b 0",
            ]
        )
        + "\r\n",
        encoding="utf-8",
    )

    docker_sh = tool_dir / "docker"
    docker_sh.write_text(
        "\n".join(
            [
                "#!/usr/bin/env bash",
                f'echo "docker $*" >> "{bash_log_path}"',
                'case "$*" in',
                '  *"http://127.0.0.1/api/v1/system/health"*)',
                '    printf "%s\\n" \'{"status":"ok"}\'',
                '    ;;',
                '  *"http://127.0.0.1/api/v1/system/ready"*)',
                '    printf "%s\\n" \'{"status":"ready","checks":{"database":true,"redis":true}}\'',
                '    ;;',
                '  *"http://127.0.0.1/internal/frontend-build"*)',
                f'    printf "%s\\n" \'{{"NEXT_PUBLIC_APP_BUILD_ID":"{app_build_id}","build_id_source":"fake-test"}}\'',
                '    ;;',
                'esac',
            ]
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )
    docker_sh.chmod(0o755)

    git_sh = tool_dir / "git"
    git_sh.write_text(
        "\n".join(
            [
                "#!/usr/bin/env bash",
                f'echo "git $*" >> "{bash_log_path}"',
                'if [[ "$1" == "rev-parse" ]]; then',
                f'  echo {app_build_id}',
                'fi',
            ]
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )
    git_sh.chmod(0o755)

    return tool_dir, log_path


def _env_without_prod_secrets() -> dict[str, str]:
    env = os.environ.copy()
    for name in ["DATABASE_URL", "POSTGRES_PASSWORD", "SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET"]:
        env.pop(name, None)
    return env


@pytest.mark.parametrize(
    ("env", "expected_message"),
    [
        pytest.param(
            _prod_env(POSTGRES_PASSWORD="different-db-password"),
            "DATABASE_URL password does not match POSTGRES_PASSWORD for the bundled postgres service",
            id="bundled-postgres-password-mismatch",
        ),
        pytest.param(
            _prod_env(SECRET_KEY="change-me-in-production"),
            "SECRET_KEY still uses an insecure placeholder-like value",
            id="placeholder-secret-key",
        ),
        pytest.param(
            _prod_env(CURSOR_SECRET="dev-secret-cursor"),
            "CURSOR_SECRET still uses an insecure placeholder-like value",
            id="placeholder-cursor-secret",
        ),
        pytest.param(
            _prod_env(CRON_SECRET="example-cron-secret"),
            "CRON_SECRET still uses an insecure placeholder-like value",
            id="placeholder-cron-secret",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="not-a-uri"),
            "DATABASE_URL is not a valid URI",
            id="invalid-database-url",
        ),
        pytest.param(
            _prod_env(DATABASE_URL=_INSECURE_DEFAULT_DB_URL),
            f"DATABASE_URL still uses the insecure {_INSECURE_DEFAULT_LABEL} default",
            id="insecure-default-database-url",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://ancap:change-me-db-password@db.example.com:5432/ancap"),
            "DATABASE_URL uses a placeholder-like database password",
            id="placeholder-database-password",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://postgres@postgres:5432/ancap"),
            "DATABASE_URL targets the bundled postgres service but does not include a password",
            id="bundled-postgres-without-password",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://ancap:real-db-password@/ancap?ghost=postgres"),
            "DATABASE_URL is not a valid URI",
            id="invalid-database-url-ghost-query-substring",
        ),
        pytest.param(
            _prod_env(POSTGRES_PASSWORD=_DB_PASS),
            "POSTGRES_PASSWORD is still using an insecure default or placeholder",
            id="insecure-default-postgres-password",
        ),
    ],
)
@pytest.mark.skipif(shutil.which("powershell") is None, reason="powershell not available")
def test_deploy_powershell_script_rejects_invalid_production_preflight(env: dict[str, str], expected_message: str):
    result = _run_deploy_powershell(env)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode != 0
    assert expected_message in combined_output


@pytest.mark.parametrize(
    ("env", "expected_message"),
    [
        pytest.param(
            _prod_env(POSTGRES_PASSWORD="different-db-password"),
            "DATABASE_URL password does not match POSTGRES_PASSWORD for the bundled postgres service",
            id="bundled-postgres-password-mismatch",
        ),
        pytest.param(
            _prod_env(SECRET_KEY="change-me-in-production"),
            "SECRET_KEY still uses an insecure placeholder-like value",
            id="placeholder-secret-key",
        ),
        pytest.param(
            _prod_env(CURSOR_SECRET="dev-secret-cursor"),
            "CURSOR_SECRET still uses an insecure placeholder-like value",
            id="placeholder-cursor-secret",
        ),
        pytest.param(
            _prod_env(CRON_SECRET="example-cron-secret"),
            "CRON_SECRET still uses an insecure placeholder-like value",
            id="placeholder-cron-secret",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="not-a-uri"),
            "DATABASE_URL is not a valid URI",
            id="invalid-database-url",
        ),
        pytest.param(
            _prod_env(DATABASE_URL=_INSECURE_DEFAULT_DB_URL),
            f"DATABASE_URL still uses the insecure {_INSECURE_DEFAULT_LABEL} default",
            id="insecure-default-database-url",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://ancap:change-me-db-password@db.example.com:5432/ancap"),
            "DATABASE_URL uses a placeholder-like database password",
            id="placeholder-database-password",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://postgres@postgres:5432/ancap"),
            "DATABASE_URL targets the bundled postgres service but does not include a password",
            id="bundled-postgres-without-password",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://ancap:real-db-password@/ancap?ghost=postgres"),
            "DATABASE_URL is not a valid URI",
            id="invalid-database-url-ghost-query-substring",
        ),
        pytest.param(
            _prod_env(POSTGRES_PASSWORD=_DB_PASS),
            "POSTGRES_PASSWORD is still using an insecure default or placeholder",
            id="insecure-default-postgres-password",
        ),
    ],
)
@pytest.mark.skipif(shutil.which("powershell") is None, reason="powershell not available")
def test_rebuild_powershell_script_rejects_invalid_production_preflight(env: dict[str, str], expected_message: str):
    result = _run_rebuild_powershell(env)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode != 0
    assert expected_message in combined_output


@pytest.mark.parametrize(
    ("env", "expected_message"),
    [
        pytest.param(
            _prod_env(POSTGRES_PASSWORD="different-db-password"),
            "DATABASE_URL password does not match POSTGRES_PASSWORD for the bundled postgres service",
            id="bundled-postgres-password-mismatch",
        ),
        pytest.param(
            _prod_env(SECRET_KEY="change-me-in-production"),
            "SECRET_KEY still uses an insecure placeholder-like value",
            id="placeholder-secret-key",
        ),
        pytest.param(
            _prod_env(CURSOR_SECRET="dev-secret-cursor"),
            "CURSOR_SECRET still uses an insecure placeholder-like value",
            id="placeholder-cursor-secret",
        ),
        pytest.param(
            _prod_env(CRON_SECRET="example-cron-secret"),
            "CRON_SECRET still uses an insecure placeholder-like value",
            id="placeholder-cron-secret",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="not-a-uri"),
            "DATABASE_URL is not a valid URI",
            id="invalid-database-url",
        ),
        pytest.param(
            _prod_env(DATABASE_URL=_INSECURE_DEFAULT_DB_URL),
            f"DATABASE_URL still uses the insecure {_INSECURE_DEFAULT_LABEL} default",
            id="insecure-default-database-url",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://ancap:change-me-db-password@db.example.com:5432/ancap"),
            "DATABASE_URL uses a placeholder-like database password",
            id="placeholder-database-password",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://postgres@postgres:5432/ancap"),
            "DATABASE_URL targets the bundled postgres service but does not include a password",
            id="bundled-postgres-without-password",
        ),
        pytest.param(
            _prod_env(DATABASE_URL="postgresql+asyncpg://ancap:real-db-password@/ancap?ghost=postgres"),
            "DATABASE_URL is not a valid URI",
            id="invalid-database-url-ghost-query-substring",
        ),
        pytest.param(
            _prod_env(POSTGRES_PASSWORD=_DB_PASS),
            "POSTGRES_PASSWORD is still using an insecure default or placeholder",
            id="insecure-default-postgres-password",
        ),
    ],
)
@pytest.mark.skipif(shutil.which("bash") is None, reason="bash not available")
def test_deploy_bash_script_rejects_invalid_production_preflight(env: dict[str, str], expected_message: str):
    result = _run_deploy_bash(env)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode != 0
    assert expected_message in combined_output


@pytest.mark.parametrize(
    ("relative_path", "expected_snippet"),
    [
        pytest.param(
            Path("docker-compose.prod.yml"),
            'POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set for docker-compose.prod.yml and must match DATABASE_URL when using the bundled postgres service}',
            id="compose-requires-postgres-password",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            '      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set for docker-compose.prod.yml and must match DATABASE_URL when using the bundled postgres service}',
            id="api-service-receives-postgres-password",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            f'DATABASE_URL: ${{DATABASE_URL:?DATABASE_URL must be set for docker-compose.prod.yml, must not use the insecure {_INSECURE_DEFAULT_LABEL} default, and must match POSTGRES_PASSWORD when using the bundled postgres service}}',
            id="compose-requires-database-url",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'SECRET_KEY: ${SECRET_KEY:?SECRET_KEY must be set for docker-compose.prod.yml}',
            id="compose-requires-secret-key",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'CURSOR_SECRET: ${CURSOR_SECRET:?CURSOR_SECRET must be set for docker-compose.prod.yml}',
            id="compose-requires-cursor-secret",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'CRON_SECRET: ${CRON_SECRET:?CRON_SECRET must be set for docker-compose.prod.yml}',
            id="compose-requires-cron-secret",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}',
            id="compose-passes-stripe-secret-key-through-to-api-service",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY:-}',
            id="compose-passes-stripe-publishable-key-through-to-api-service",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}',
            id="compose-passes-stripe-webhook-secret-through-to-api-service",
        ),
        pytest.param(
            Path("docker-compose.prod.yml"),
            'STRIPE_API_BASE: ${STRIPE_API_BASE:-https://api.stripe.com/v1}',
            id="compose-passes-stripe-api-base-through-to-api-service",
        ),
        pytest.param(
            Path("scripts/deploy-ancap-cloud.ps1"),
            '$requiredProdSecrets = @("DATABASE_URL", "POSTGRES_PASSWORD", "SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET")',
            id="powershell-deploy-requires-all-critical-secrets",
        ),
        pytest.param(
            Path("scripts/rebuild-prod.ps1"),
            '$requiredProdSecrets = @("DATABASE_URL", "POSTGRES_PASSWORD", "SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET")',
            id="powershell-rebuild-requires-all-critical-secrets",
        ),
        pytest.param(
            Path("scripts/deploy-ancap-cloud.sh"),
            'REQUIRED_PROD_SECRETS=(DATABASE_URL POSTGRES_PASSWORD SECRET_KEY CURSOR_SECRET CRON_SECRET)',
            id="bash-deploy-requires-all-critical-secrets",
        ),
    ],
)
def test_prod_stack_files_keep_all_critical_secret_guards(relative_path: Path, expected_snippet: str):
    text = (REPO_ROOT / relative_path).read_text(encoding="utf-8")
    assert expected_snippet in text


@pytest.mark.skipif(shutil.which("docker") is None, reason="docker not available")
def test_prod_compose_config_quiet_succeeds_with_valid_required_env(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(tmp_path, script_names=(), bridge_env_text="")
    env_file = tmp_path / "empty.env"
    env_file.write_text("", encoding="utf-8")
    env = _env_without_prod_secrets()
    env.update(
        {
            "DATABASE_URL": "postgresql+asyncpg://postgres:compose-pass@postgres:5432/ancap",
            "POSTGRES_PASSWORD": "compose-pass",
            "SECRET_KEY": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            "CURSOR_SECRET": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            "CRON_SECRET": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
        }
    )

    result = _run_prod_compose_config_quiet(env, repo_root=repo_root, env_file=env_file)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output


@pytest.mark.skipif(shutil.which("docker") is None, reason="docker not available")
def test_prod_compose_config_passes_runtime_env_through_to_api_service(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(tmp_path, script_names=(), bridge_env_text="")
    env_file = tmp_path / "empty.env"
    env_file.write_text("", encoding="utf-8")
    env = _env_without_prod_secrets()
    env.update(
        {
            "DATABASE_URL": "postgresql+asyncpg://postgres:compose-pass@postgres:5432/ancap",
            "POSTGRES_PASSWORD": "compose-pass",
            "SECRET_KEY": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            "CURSOR_SECRET": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            "CRON_SECRET": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
            "STRIPE_SECRET_KEY": "sk_live_runtime_test",
            "STRIPE_PUBLISHABLE_KEY": "pk_live_runtime_test",
            "STRIPE_WEBHOOK_SECRET": "whsec_runtime_test",
            "STRIPE_API_BASE": "https://stripe.example.test/v1",
        }
    )

    result = subprocess.run(
        [
            "docker",
            "compose",
            "--env-file",
            str(env_file),
            "-f",
            str(repo_root / "docker-compose.prod.yml"),
            "config",
        ],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert "POSTGRES_PASSWORD: compose-pass" in result.stdout
    assert "STRIPE_SECRET_KEY: sk_live_runtime_test" in result.stdout
    assert "STRIPE_PUBLISHABLE_KEY: pk_live_runtime_test" in result.stdout
    assert "STRIPE_WEBHOOK_SECRET: whsec_runtime_test" in result.stdout
    assert "STRIPE_API_BASE: https://stripe.example.test/v1" in result.stdout


@pytest.mark.skipif(shutil.which("docker") is None, reason="docker not available")
def test_prod_compose_config_quiet_fails_fast_without_printing_other_secret_values(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(tmp_path, script_names=(), bridge_env_text="")
    env_file = tmp_path / "empty.env"
    env_file.write_text("", encoding="utf-8")
    env = _env_without_prod_secrets()
    env.update(
        {
            "DATABASE_URL": "postgresql+asyncpg://postgres:compose-pass@postgres:5432/ancap",
            "POSTGRES_PASSWORD": "compose-pass",
            "SECRET_KEY": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            "CURSOR_SECRET": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        }
    )

    result = _run_prod_compose_config_quiet(env, repo_root=repo_root, env_file=env_file)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode != 0
    assert "CRON_SECRET must be set for docker-compose.prod.yml" in combined_output
    assert env["SECRET_KEY"] not in combined_output
    assert env["CURSOR_SECRET"] not in combined_output
    assert env["POSTGRES_PASSWORD"] not in combined_output
    assert env["DATABASE_URL"] not in combined_output


@pytest.mark.skipif(shutil.which("powershell") is None, reason="powershell not available")
def test_deploy_powershell_loads_repo_root_dotenv_before_running_docker(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=("deploy-ancap-cloud.ps1",),
        dotenv_text=(
            "DATABASE_URL=postgresql+asyncpg://postgres:from-dotenv@postgres:5432/ancap\r\n"
            "POSTGRES_PASSWORD=from-dotenv\r\n"
            "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\r\n"
            "CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\r\n"
            "CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210\r\n"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path)
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = _run_deploy_powershell(env, repo_root=repo_root)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "docker compose -f" in log_text
    assert " config --quiet" in log_text
    assert "git rev-parse --short HEAD" in log_text
    assert 'Loaded compose substitution secrets from:' in result.stdout
    assert 'Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets...' in result.stdout
    assert 'Skipping live proxy/frontend verification by request (-SkipPostDeployChecks).' in result.stdout


@pytest.mark.skipif(shutil.which("powershell") is None, reason="powershell not available")
def test_rebuild_powershell_loads_repo_root_dotenv_before_running_docker(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=("rebuild-prod.ps1",),
        dotenv_text=(
            "DATABASE_URL=postgresql+asyncpg://postgres:from-dotenv@postgres:5432/ancap\r\n"
            "POSTGRES_PASSWORD=from-dotenv\r\n"
            "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\r\n"
            "CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\r\n"
            "CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210\r\n"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path)
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = _run_rebuild_powershell(env, repo_root=repo_root)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "docker compose -f" in log_text
    assert " config --quiet" in log_text
    assert "git rev-parse --short HEAD" in log_text
    assert 'Loaded compose substitution secrets from:' in result.stdout
    assert 'Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets...' in result.stdout


@pytest.mark.skipif(shutil.which("powershell") is None, reason="powershell not available")
def test_deploy_powershell_runs_live_post_deploy_verification_by_default(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=("deploy-ancap-cloud.ps1",),
        dotenv_text=(
            "DATABASE_URL=postgresql+asyncpg://postgres:from-dotenv@postgres:5432/ancap\r\n"
            "POSTGRES_PASSWORD=from-dotenv\r\n"
            "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\r\n"
            "CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\r\n"
            "CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210\r\n"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path, app_build_id="deadbee")
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = _run_deploy_powershell(env, repo_root=repo_root, skip_post_deploy_checks=False)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "http://127.0.0.1/api/v1/system/health" in log_text
    assert "http://127.0.0.1/api/v1/system/ready" in log_text
    assert "http://127.0.0.1/internal/frontend-build" in log_text
    assert 'Verifying live proxy liveness via /api/v1/system/health ...' in result.stdout
    assert 'OK /api/v1/system/health -> status=ok' in result.stdout
    assert 'Verifying live proxy readiness via /api/v1/system/ready ...' in result.stdout
    assert 'OK /api/v1/system/ready -> status=ready' in result.stdout
    assert 'Verifying frontend build provenance via /internal/frontend-build ...' in result.stdout
    assert 'OK /internal/frontend-build -> NEXT_PUBLIC_APP_BUILD_ID=deadbee (source=fake-test)' in result.stdout
    assert 'Skipping live proxy/frontend verification by request (-SkipPostDeployChecks).' not in result.stdout


@pytest.mark.parametrize(
    ("script_name", "runner", "dotenv_line_ending", "database_url", "postgres_password"),
    [
        pytest.param(
            "deploy-ancap-cloud.ps1",
            _run_deploy_powershell,
            "\r\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@postgres:5432/ancap",
            "p@ss:word",
            id="powershell-deploy-authority-host-urlencoded-password",
        ),
        pytest.param(
            "rebuild-prod.ps1",
            _run_rebuild_powershell,
            "\r\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@postgres:5432/ancap",
            "p@ss:word",
            id="powershell-rebuild-authority-host-urlencoded-password",
        ),
        pytest.param(
            "deploy-ancap-cloud.sh",
            _run_deploy_bash,
            "\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@postgres:5432/ancap",
            "p@ss:word",
            id="bash-deploy-authority-host-urlencoded-password",
        ),
        pytest.param(
            "deploy-ancap-cloud.ps1",
            _run_deploy_powershell,
            "\r\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@/ancap?host=postgres",
            "p@ss:word",
            id="powershell-deploy-socket-host-urlencoded-password",
        ),
        pytest.param(
            "rebuild-prod.ps1",
            _run_rebuild_powershell,
            "\r\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@/ancap?host=postgres",
            "p@ss:word",
            id="powershell-rebuild-socket-host-urlencoded-password",
        ),
        pytest.param(
            "deploy-ancap-cloud.sh",
            _run_deploy_bash,
            "\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@/ancap?host=postgres",
            "p@ss:word",
            id="bash-deploy-socket-host-urlencoded-password",
        ),
        pytest.param(
            "deploy-ancap-cloud.ps1",
            _run_deploy_powershell,
            "\r\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@/ancap?host=%70ostgres",
            "p@ss:word",
            id="powershell-deploy-encoded-socket-host-urlencoded-password",
        ),
        pytest.param(
            "rebuild-prod.ps1",
            _run_rebuild_powershell,
            "\r\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@/ancap?host=%70ostgres",
            "p@ss:word",
            id="powershell-rebuild-encoded-socket-host-urlencoded-password",
        ),
        pytest.param(
            "deploy-ancap-cloud.sh",
            _run_deploy_bash,
            "\n",
            "postgresql+asyncpg://postgres:p%40ss%3Aword@/ancap?host=%70ostgres",
            "p@ss:word",
            id="bash-deploy-encoded-socket-host-urlencoded-password",
        ),
    ],
)
@pytest.mark.skipif(shutil.which("powershell") is None and shutil.which("bash") is None, reason="shells not available")
def test_prod_deploy_helpers_accept_urlencoded_bundled_postgres_password_variants(
    tmp_path: Path,
    script_name: str,
    runner,
    dotenv_line_ending: str,
    database_url: str,
    postgres_password: str,
):
    if script_name.endswith(".ps1") and shutil.which("powershell") is None:
        pytest.skip("powershell not available")
    if script_name.endswith(".sh") and shutil.which("bash") is None:
        pytest.skip("bash not available")

    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=(script_name,),
        dotenv_text=(
            f"DATABASE_URL={database_url}{dotenv_line_ending}"
            f"POSTGRES_PASSWORD={postgres_password}{dotenv_line_ending}"
            f"SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef{dotenv_line_ending}"
            f"CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789{dotenv_line_ending}"
            f"CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210{dotenv_line_ending}"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path)
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = runner(env, repo_root=repo_root)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "docker compose -f" in log_text
    assert " config --quiet" in log_text
    assert "DATABASE_URL password does not match POSTGRES_PASSWORD" not in combined_output
    assert "Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets..." in result.stdout
    if script_name == "deploy-ancap-cloud.ps1":
        assert 'Skipping live proxy/frontend verification by request (-SkipPostDeployChecks).' in result.stdout


@pytest.mark.skipif(shutil.which("bash") is None, reason="bash not available")
def test_deploy_bash_loads_crlf_repo_root_dotenv_before_running_docker(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=("deploy-ancap-cloud.sh",),
        dotenv_text=(
            "DATABASE_URL=postgresql+asyncpg://postgres:from-dotenv@postgres:5432/ancap\r\n"
            "POSTGRES_PASSWORD=from-dotenv\r\n"
            "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\r\n"
            "CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\r\n"
            "CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210\r\n"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path)
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = _run_deploy_bash(env, repo_root=repo_root)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "docker compose -f" in log_text
    assert " config --quiet" in log_text
    assert "Loaded compose substitution secrets from:" in result.stdout
    assert "Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets..." in result.stdout
    assert "APP_BUILD_ID=" in result.stdout
    assert "Skipping live proxy/frontend verification by request (--skip-post-deploy-checks)." in result.stdout


@pytest.mark.skipif(shutil.which("bash") is None, reason="bash not available")
def test_deploy_bash_accepts_urlencoded_bundled_postgres_password(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=("deploy-ancap-cloud.sh",),
        dotenv_text=(
            "DATABASE_URL=postgresql+asyncpg://postgres:p%40ss%3Aword@postgres:5432/ancap\n"
            "POSTGRES_PASSWORD=p@ss:word\n"
            "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n"
            "CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\n"
            "CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210\n"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path)
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = _run_deploy_bash(env, repo_root=repo_root)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "docker compose -f" in log_text
    assert " config --quiet" in log_text
    assert "DATABASE_URL password does not match POSTGRES_PASSWORD" not in combined_output
    assert "Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets..." in result.stdout
    assert "Skipping live proxy/frontend verification by request (--skip-post-deploy-checks)." in result.stdout


@pytest.mark.skipif(shutil.which("bash") is None, reason="bash not available")
def test_deploy_bash_runs_live_post_deploy_verification_by_default(tmp_path: Path):
    repo_root = _stage_minimal_prod_repo(
        tmp_path,
        script_names=("deploy-ancap-cloud.sh",),
        dotenv_text=(
            "DATABASE_URL=postgresql+asyncpg://postgres:from-dotenv@postgres:5432/ancap\n"
            "POSTGRES_PASSWORD=from-dotenv\n"
            "SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n"
            "CURSOR_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\n"
            "CRON_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210\n"
        ),
    )
    tool_dir, log_path = _make_fake_tool_dir(tmp_path, app_build_id="unknown")
    env = _env_without_prod_secrets()
    env["PATH"] = str(tool_dir) + os.pathsep + env.get("PATH", "")

    result = _run_deploy_bash(env, repo_root=repo_root, skip_post_deploy_checks=False)

    combined_output = f"{result.stdout}\n{result.stderr}"
    assert result.returncode == 0, combined_output
    assert log_path.exists()
    log_text = log_path.read_text(encoding="utf-8")
    assert "http://127.0.0.1/api/v1/system/health" in log_text
    assert "http://127.0.0.1/api/v1/system/ready" in log_text
    assert "http://127.0.0.1/internal/frontend-build" in log_text
    assert "Verifying live proxy liveness via /api/v1/system/health ..." in result.stdout
    assert "OK /api/v1/system/health -> status=ok" in result.stdout
    assert "Verifying live proxy readiness via /api/v1/system/ready ..." in result.stdout
    assert "OK /api/v1/system/ready -> status=ready" in result.stdout
    assert "Verifying frontend build provenance via /internal/frontend-build ..." in result.stdout
    assert "OK /internal/frontend-build -> NEXT_PUBLIC_APP_BUILD_ID=unknown" in result.stdout
    assert "Skipping live proxy/frontend verification by request (--skip-post-deploy-checks)." not in result.stdout
