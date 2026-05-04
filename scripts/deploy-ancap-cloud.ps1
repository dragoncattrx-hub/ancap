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
$bridgeEnv = Join-Path $root "Sicret\bridge-bsc\bridge.env"
$composeArgs = @("-f", $compose)
if (Test-Path $bridgeEnv) {
    $composeArgs = @("--env-file", $bridgeEnv, "-f", $compose)
    Write-Host ('Using bridge env file: ' + $bridgeEnv)
}

if (-not $SkipGitPull) {
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$rev = git rev-parse --short HEAD 2>$null
if ($LASTEXITCODE -eq 0 -and $rev) {
    $env:APP_BUILD_ID = $rev.Trim()
} else {
    $env:APP_BUILD_ID = "unknown"
}
Write-Host ('APP_BUILD_ID=' + $env:APP_BUILD_ID + ' -- after deploy, https://ancap.cloud/internal/frontend-build must show the same id')

Write-Host 'Building images (no cache)...'
docker compose @composeArgs build --no-cache
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Starting stack...'
docker compose @composeArgs up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipMigrations) {
    Write-Host 'Alembic upgrade head (api container)...'
    docker compose @composeArgs exec -T api alembic upgrade head
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host 'Done. Open https://ancap.cloud/bridge/acp-bsc -- if still 404, purge Cloudflare cache for the hostname.'
