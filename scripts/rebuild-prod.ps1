# Rebuild production-like Docker images (api + frontend + proxy stack).
# Usage: .\scripts\rebuild-prod.ps1
# Optional: .\scripts\rebuild-prod.ps1 --no-cache

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$compose = Join-Path $root "docker-compose.prod.yml"
if (-not (Test-Path $compose)) {
    Write-Error "docker-compose.prod.yml not found under $root"
}

$rev = git rev-parse --short HEAD 2>$null
if ($LASTEXITCODE -eq 0 -and $rev) {
    $env:APP_BUILD_ID = $rev.Trim()
} else {
    $env:APP_BUILD_ID = "unknown"
}

docker compose -f $compose build @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "OK: docker compose -f docker-compose.prod.yml build"
