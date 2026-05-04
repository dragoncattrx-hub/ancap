# Full stack refresh for ancap.cloud (Docker Compose prod): rebuild UI/API and apply DB migrations.
# Run on the HOST behind Cloudflare Tunnel (repo root = ANCAP clone). Requires Docker + git.
#
# Usage:
#   .\scripts\deploy-ancap-cloud.ps1
#   .\scripts\deploy-ancap-cloud.ps1 -SkipGitPull
#   .\scripts\deploy-ancap-cloud.ps1 -SkipMigrations

param(
    [switch] $SkipGitPull,
    [switch] $SkipMigrations
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$compose = Join-Path $root "docker-compose.prod.yml"
if (-not (Test-Path $compose)) { Write-Error "Missing docker-compose.prod.yml in $root" }

if (-not $SkipGitPull) {
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Building images (no cache)..."
docker compose -f $compose build --no-cache
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting stack..."
docker compose -f $compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipMigrations) {
    Write-Host "Alembic upgrade head (api container)..."
    docker compose -f $compose exec -T api alembic upgrade head
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Done. Open https://ancap.cloud/bridge/acp-bsc — if still 404, purge Cloudflare cache for the hostname."
