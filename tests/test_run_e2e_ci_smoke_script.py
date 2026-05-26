from pathlib import Path


SCRIPT_PATH = Path("scripts/run-e2e-ci-smoke.ps1")


def test_e2e_smoke_script_checks_docker_port_conflicts_before_compose_up():
    script_text = SCRIPT_PATH.read_text(encoding="utf-8")

    assert "function Get-DockerContainersPublishingPort" in script_text
    assert "function Assert-DockerPublishedPortAvailable" in script_text
    assert 'docker ps --format "{{.Names}}|{{.Ports}}"' in script_text
    assert 'Assert-DockerPublishedPortAvailable -Port $ApiPort -Label "API" -ProjectName $ProjectName -PortArgumentName "ApiPort"' in script_text
    assert 'Assert-DockerPublishedPortAvailable -Port $PostgresPort -Label "Postgres" -ProjectName $ProjectName -PortArgumentName "PostgresPort"' in script_text
    assert 'Assert-DockerPublishedPortAvailable -Port $RedisPort -Label "Redis" -ProjectName $ProjectName -PortArgumentName "RedisPort"' in script_text
    assert 'docker compose -p <project> down -v' in script_text
    assert 'Start-Process -FilePath $nextCli' in script_text
    assert '-ArgumentList @("start", "-p", "$FrontendPort")' in script_text
    assert '$frontendPortProcess = Get-ListeningProcessForPort -Port $FrontendPort' in script_text
    assert 'foreach ($processId in ($frontendCleanupIds | Select-Object -Unique))' in script_text
