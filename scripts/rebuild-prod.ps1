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

$dotenv = Join-Path $root ".env"
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
            ". Set them in $dotenv or export them in the shell before running this rebuild script."
        )
    }

    foreach ($secretName in @("SECRET_KEY", "CURSOR_SECRET", "CRON_SECRET")) {
        $secretValue = [Environment]::GetEnvironmentVariable($secretName, 'Process')
        if (Test-PlaceholderLikeSecret -Value $secretValue) {
            throw (
                ($secretName + " still uses an insecure placeholder-like value. ") +
                "Set a real random secret before running this rebuild script."
            )
        }
    }

    $databaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", 'Process')
    if (-not [string]::IsNullOrWhiteSpace($databaseUrl) -and $databaseUrl.ToLowerInvariant().Contains("://postgres:postgres@")) {
        throw (
            "DATABASE_URL still uses the insecure postgres:postgres default. " +
            "Set a real database password before running this rebuild script."
        )
    }

    if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
        try {
            $databaseUri = [System.Uri] $databaseUrl
        }
        catch {
            throw "DATABASE_URL is not a valid URI. Fix it before running this rebuild script."
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
                    "Set a real database password before running this rebuild script."
                )
            }
            if (Test-PlaceholderLikeSecret -Value $databasePassword) {
                throw (
                    "DATABASE_URL uses a placeholder-like database password. " +
                    "Set a real database password before running this rebuild script."
                )
            }
        }

        if ($databaseUri.Host.ToLowerInvariant() -eq "postgres" -and [string]::IsNullOrWhiteSpace($databasePassword)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a password. " +
                "Set DATABASE_URL with the real POSTGRES_PASSWORD before running this rebuild script."
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
                "Set a real non-default password before running this rebuild script."
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
                "Keep them in sync before running this rebuild script."
            )
        }
    }
}

Import-DotEnvIfPresent -Path $dotenv
Assert-RequiredSecrets -Names $requiredProdSecrets

if (Test-Path $dotenv) {
    Write-Host ('Loaded compose substitution secrets from: ' + $dotenv)
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
