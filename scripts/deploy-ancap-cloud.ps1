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
$composeArgs = @("-f", $compose)
$dotenv = Join-Path $root ".env"
$bridgeEnv = Join-Path $root "Sicret\bridge-bsc\bridge.env"
$requiredProdSecrets = @("DATABASE_URL", "POSTGRES_PASSWORD", "SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET")

function Import-DotEnvIfPresent {
    param([string] $Path)

    if (-not (Test-Path $Path)) {
        return
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) {
            return
        }

        $match = [regex]::Match($line, '^(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<value>.*)$')
        if (-not $match.Success) {
            return
        }

        $name = $match.Groups['name'].Value
        $value = $match.Groups['value'].Value.Trim()
        if ($value.Length -ge 2) {
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        $existing = [Environment]::GetEnvironmentVariable($name, 'Process')
        if ([string]::IsNullOrWhiteSpace($existing)) {
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
}

function Test-PlaceholderLikeSecret {
    param([string] $Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $false
    }

    $normalizedValue = $Value.Trim().ToLowerInvariant()
    foreach ($phrase in @("change", "dev-secret", "change-me", "changeme", "secret", "example", "placeholder")) {
        if ($normalizedValue.Contains($phrase)) {
            return $true
        }
    }

    return $false
}

function Assert-RequiredSecrets {
    param([string[]] $Names)

    $missing = @()
    foreach ($name in $Names) {
        $value = [Environment]::GetEnvironmentVariable($name, 'Process')
        if ([string]::IsNullOrWhiteSpace($value)) {
            $missing += $name
        }
    }

    if ($missing.Count -gt 0) {
        throw (
            "Missing required production secrets for docker-compose.prod.yml: " + ($missing -join ", ") +
            ". Set them in $dotenv or export them in the shell before running this deploy script."
        )
    }

    foreach ($secretName in @("SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET")) {
        $secretValue = [Environment]::GetEnvironmentVariable($secretName, 'Process')
        if (Test-PlaceholderLikeSecret -Value $secretValue) {
            throw (
                ($secretName + " still uses an insecure placeholder-like value. ") +
                "Set a real random secret before running this deploy script."
            )
        }
    }

    $databaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", 'Process')
    if (-not [string]::IsNullOrWhiteSpace($databaseUrl) -and $databaseUrl.ToLowerInvariant().Contains("://postgres:postgres@")) {
        throw (
            "DATABASE_URL still uses the insecure postgres:postgres default. " +
            "Set a real database password before running this deploy script."
        )
    }

    if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
        try {
            $databaseUri = [System.Uri] $databaseUrl
        }
        catch {
            throw "DATABASE_URL is not a valid URI. Fix it before running this deploy script."
        }

        $databaseUserInfo = $databaseUri.UserInfo
        $databasePassword = $null
        if (-not [string]::IsNullOrWhiteSpace($databaseUserInfo) -and $databaseUserInfo.Contains(':')) {
            $databasePassword = [System.Uri]::UnescapeDataString(($databaseUserInfo.Split(':', 2)[1]))
        }

        if (-not [string]::IsNullOrWhiteSpace($databasePassword)) {
            $normalizedDatabasePassword = $databasePassword.Trim().ToLowerInvariant()
            if ($normalizedDatabasePassword -eq "postgres") {
                throw (
                    "DATABASE_URL still uses the insecure postgres database password. " +
                    "Set a real database password before running this deploy script."
                )
            }
            if (Test-PlaceholderLikeSecret -Value $databasePassword) {
                throw (
                    "DATABASE_URL uses a placeholder-like database password. " +
                    "Set a real database password before running this deploy script."
                )
            }
        }

        if ($databaseUri.Host.ToLowerInvariant() -eq "postgres" -and [string]::IsNullOrWhiteSpace($databasePassword)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a password. " +
                "Set DATABASE_URL with the real POSTGRES_PASSWORD before running this deploy script."
            )
        }
    }

    $postgresPassword = [Environment]::GetEnvironmentVariable("POSTGRES_PASSWORD", 'Process')
    if (-not [string]::IsNullOrWhiteSpace($postgresPassword)) {
        $normalizedPostgresPassword = $postgresPassword.Trim().ToLowerInvariant()
        if (
            $normalizedPostgresPassword -eq "postgres" -or
            (Test-PlaceholderLikeSecret -Value $postgresPassword)
        ) {
            throw (
                "POSTGRES_PASSWORD is still using an insecure default or placeholder. " +
                "Set a real non-default password before running this deploy script."
            )
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
        $databaseUri = [System.Uri] $databaseUrl
        $databaseUserInfo = $databaseUri.UserInfo
        $databasePassword = $null
        if (-not [string]::IsNullOrWhiteSpace($databaseUserInfo) -and $databaseUserInfo.Contains(':')) {
            $databasePassword = [System.Uri]::UnescapeDataString(($databaseUserInfo.Split(':', 2)[1]))
        }

        if (
            $databaseUri.Host.ToLowerInvariant() -eq "postgres" -and
            -not [string]::IsNullOrWhiteSpace($databasePassword) -and
            -not [string]::IsNullOrWhiteSpace($postgresPassword) -and
            $databasePassword -ne $postgresPassword
        ) {
            throw (
                "DATABASE_URL password does not match POSTGRES_PASSWORD for the bundled postgres service. " +
                "Keep them in sync before running this deploy script."
            )
        }
    }
}

Import-DotEnvIfPresent -Path $dotenv
Assert-RequiredSecrets -Names $requiredProdSecrets

if (Test-Path $dotenv) {
    Write-Host ('Loaded compose substitution secrets from: ' + $dotenv)
}
if (Test-Path $bridgeEnv) {
    Write-Host ('Bridge runtime secrets remain sourced by docker-compose.prod.yml via service env_file: ' + $bridgeEnv)
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
