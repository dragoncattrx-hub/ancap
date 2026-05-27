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
$bundledPostgresDefaultUser = "postgres"
$bundledPostgresDefaultDatabase = "ancap"

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

function Parse-DatabaseUrlLikeString {
    param([string] $Value)

    $match = [regex]::Match($Value, '^(?<scheme>[A-Za-z][A-Za-z0-9+.-]*)://(?<authority>[^/?#]*)(?<path>/[^?#]*)?(?:\?(?<query>[^#]*))?(?:#.*)?$')
    if (-not $match.Success) {
        return $null
    }

    $authority = $match.Groups['authority'].Value
    $query = $match.Groups['query'].Value
    $dbHost = ""
    $password = $null

    if (-not [string]::IsNullOrWhiteSpace($authority)) {
        $authorityHost = $authority
        if ($authority.Contains('@')) {
            $userInfo, $authorityHost = $authority.Split('@', 2)
            if ($userInfo.Contains(':')) {
                $password = [System.Uri]::UnescapeDataString(($userInfo.Split(':', 2)[1]))
            }
        }

        if ($authorityHost.StartsWith('[')) {
            $ipv6Match = [regex]::Match($authorityHost, '^\[(?<host>[^\]]+)\](?::\d+)?$')
            if ($ipv6Match.Success) {
                $dbHost = $ipv6Match.Groups['host'].Value
            }
        } else {
            $dbHost = ($authorityHost.Split(':', 2)[0])
        }
    }

    $socketHostQuery = $null
    if (-not [string]::IsNullOrWhiteSpace($query)) {
        foreach ($pair in $query.Split('&', [System.StringSplitOptions]::RemoveEmptyEntries)) {
            $parts = $pair.Split('=', 2)
            if ($parts[0] -eq 'host') {
                $socketHostQuery = [System.Uri]::UnescapeDataString(($parts | Select-Object -Skip 1 -First 1))
                break
            }
        }
    }

    $path = $match.Groups['path'].Value
    $username = $null
    if (-not [string]::IsNullOrWhiteSpace($authority) -and $authority.Contains('@')) {
        $userInfo = $authority.Split('@', 2)[0]
        if (-not [string]::IsNullOrWhiteSpace($userInfo)) {
            $username = [System.Uri]::UnescapeDataString(($userInfo.Split(':', 2)[0]))
        }
    }

    return [pscustomobject]@{
        Scheme = $match.Groups['scheme'].Value
        Host = $dbHost
        SocketHostQuery = $socketHostQuery
        Username = $username
        Password = $password
        Path = $path
    }
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

    $postgresUser = [Environment]::GetEnvironmentVariable("POSTGRES_USER", 'Process')
    if ([string]::IsNullOrWhiteSpace($postgresUser)) {
        $postgresUser = $bundledPostgresDefaultUser
    }
    $postgresDb = [Environment]::GetEnvironmentVariable("POSTGRES_DB", 'Process')
    if ([string]::IsNullOrWhiteSpace($postgresDb)) {
        $postgresDb = $bundledPostgresDefaultDatabase
    }

    if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
        $parsedDatabaseUrl = Parse-DatabaseUrlLikeString -Value $databaseUrl
        $hasSocketHostQuery = $null -ne $parsedDatabaseUrl -and -not [string]::IsNullOrWhiteSpace($parsedDatabaseUrl.SocketHostQuery)
        if ($null -eq $parsedDatabaseUrl -or [string]::IsNullOrWhiteSpace($parsedDatabaseUrl.Scheme) -or ([string]::IsNullOrWhiteSpace($parsedDatabaseUrl.Host) -and -not $hasSocketHostQuery)) {
            throw "DATABASE_URL is not a valid URI. Fix it before running this rebuild script."
        }

        $databasePassword = $parsedDatabaseUrl.Password
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

        $databaseName = $null
        if ($parsedDatabaseUrl.Path -and $parsedDatabaseUrl.Path.Length -gt 1) {
            $databaseName = [System.Uri]::UnescapeDataString($parsedDatabaseUrl.Path.TrimStart('/'))
        }
        $databaseUsername = $parsedDatabaseUrl.Username
        $usesBundledPostgres = $parsedDatabaseUrl.Host.ToLowerInvariant() -eq "postgres" -or (
            -not [string]::IsNullOrWhiteSpace($parsedDatabaseUrl.SocketHostQuery) -and $parsedDatabaseUrl.SocketHostQuery.ToLowerInvariant() -eq "postgres"
        )

        if ($usesBundledPostgres -and [string]::IsNullOrWhiteSpace($databasePassword)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a password. " +
                "Set DATABASE_URL with the real POSTGRES_PASSWORD before running this rebuild script."
            )
        }
        if ($usesBundledPostgres -and [string]::IsNullOrWhiteSpace($databaseUsername)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a username. " +
                "Set DATABASE_URL to use POSTGRES_USER before running this rebuild script."
            )
        }
        if ($usesBundledPostgres -and $databaseUsername -ne $postgresUser) {
            throw (
                "DATABASE_URL username does not match POSTGRES_USER for the bundled postgres service. " +
                "Keep them in sync before running this rebuild script."
            )
        }
        if ($usesBundledPostgres -and [string]::IsNullOrWhiteSpace($databaseName)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a database name. " +
                "Set DATABASE_URL to target POSTGRES_DB before running this rebuild script."
            )
        }
        if ($usesBundledPostgres -and $databaseName -ne $postgresDb) {
            throw (
                "DATABASE_URL database name does not match POSTGRES_DB for the bundled postgres service. " +
                "Keep them in sync before running this rebuild script."
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
        $parsedDatabaseUrl = Parse-DatabaseUrlLikeString -Value $databaseUrl
        $databasePassword = $parsedDatabaseUrl.Password
        $usesBundledPostgres = $parsedDatabaseUrl.Host.ToLowerInvariant() -eq "postgres" -or (
            -not [string]::IsNullOrWhiteSpace($parsedDatabaseUrl.SocketHostQuery) -and $parsedDatabaseUrl.SocketHostQuery.ToLowerInvariant() -eq "postgres"
        )

        if (
            $usesBundledPostgres -and
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

Write-Host "Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets..."
docker compose -f $compose config --quiet
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$buildArgs = @("-f", $compose, "build") + $args
Write-Host ("Running: docker compose " + ($buildArgs -join ' '))
docker compose @buildArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "OK: docker compose -f docker-compose.prod.yml build"
