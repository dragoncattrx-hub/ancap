# Full stack refresh for ancap.cloud (Docker Compose prod): rebuild UI/API and apply DB migrations.
# Run on the HOST behind Cloudflare Tunnel (repo root = ANCAP clone). Requires Docker + git.
#
# Usage:
#   .\scripts\deploy-ancap-cloud.ps1
#   .\scripts\deploy-ancap-cloud.ps1 -SkipGitPull
#   .\scripts\deploy-ancap-cloud.ps1 -SkipMigrations
#   .\scripts\deploy-ancap-cloud.ps1 -SkipPostDeployChecks

param(
    [switch] $SkipGitPull,
    [switch] $SkipMigrations,
    [switch] $SkipPostDeployChecks
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
            throw "DATABASE_URL is not a valid URI. Fix it before running this deploy script."
        }

        $databasePassword = $parsedDatabaseUrl.Password
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
                "Set DATABASE_URL with the real POSTGRES_PASSWORD before running this deploy script."
            )
        }
        if ($usesBundledPostgres -and [string]::IsNullOrWhiteSpace($databaseUsername)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a username. " +
                "Set DATABASE_URL to use POSTGRES_USER before running this deploy script."
            )
        }
        if ($usesBundledPostgres -and $databaseUsername -ne $postgresUser) {
            throw (
                "DATABASE_URL username does not match POSTGRES_USER for the bundled postgres service. " +
                "Keep them in sync before running this deploy script."
            )
        }
        if ($usesBundledPostgres -and [string]::IsNullOrWhiteSpace($databaseName)) {
            throw (
                "DATABASE_URL targets the bundled postgres service but does not include a database name. " +
                "Set DATABASE_URL to target POSTGRES_DB before running this deploy script."
            )
        }
        if ($usesBundledPostgres -and $databaseName -ne $postgresDb) {
            throw (
                "DATABASE_URL database name does not match POSTGRES_DB for the bundled postgres service. " +
                "Keep them in sync before running this deploy script."
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
                "Keep them in sync before running this deploy script."
            )
        }
    }
}

function Invoke-ProxyJsonGet {
    param([string] $Path)

    $url = 'http://127.0.0.1' + $Path
    $output = docker compose @composeArgs exec -T proxy wget -qO- $url 2>$null
    return [pscustomobject]@{
        ExitCode = $LASTEXITCODE
        Output = ($output | Out-String).Trim()
        Url = $url
    }
}

function Wait-ForProxyStatus {
    param(
        [string] $Path,
        [string] $ExpectedStatus,
        [string] $Label,
        [int] $Attempts = 30,
        [int] $DelaySeconds = 2
    )

    $lastPayload = $null
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $result = Invoke-ProxyJsonGet -Path $Path
        if ($result.ExitCode -eq 0 -and $result.Output) {
            $lastPayload = $result.Output
            try {
                $payload = $result.Output | ConvertFrom-Json
                if ($payload.status -eq $ExpectedStatus) {
                    return $payload
                }
            } catch {
                $lastPayload = $result.Output
            }
        }

        if ($attempt -lt $Attempts) {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    $lastPayloadText = if ($null -ne $lastPayload) { [string] $lastPayload } else { '<none>' }
    throw (
        $Label + ' did not reach status ''' + $ExpectedStatus + ''' via ' +
        ('http://127.0.0.1' + $Path) + '. Last payload: ' + $lastPayloadText
    )
}

function Assert-FrontendBuildId {
    param(
        [string] $ExpectedBuildId,
        [int] $Attempts = 30,
        [int] $DelaySeconds = 2
    )

    $path = '/internal/frontend-build'
    $lastPayload = $null
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $result = Invoke-ProxyJsonGet -Path $path
        if ($result.ExitCode -eq 0 -and $result.Output) {
            $lastPayload = $result.Output
            try {
                $payload = $result.Output | ConvertFrom-Json
                if ($payload.NEXT_PUBLIC_APP_BUILD_ID -eq $ExpectedBuildId) {
                    return $payload
                }
            } catch {
                $lastPayload = $result.Output
            }
        }

        if ($attempt -lt $Attempts) {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    $lastPayloadText = if ($null -ne $lastPayload) { [string] $lastPayload } else { '<none>' }
    throw (
        'Frontend build id behind proxy did not match APP_BUILD_ID=' + $ExpectedBuildId +
        ' via http://127.0.0.1/internal/frontend-build. Last payload: ' + $lastPayloadText
    )
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

Write-Host 'Validating docker-compose.prod.yml interpolation and required vars without printing resolved secrets...'
docker compose @composeArgs config --quiet
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

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

if ($SkipPostDeployChecks) {
    Write-Host 'Skipping live proxy/frontend verification by request (-SkipPostDeployChecks).'
    Write-Host 'Done. Build/start completed without live post-deploy verification.'
    exit 0
}

Write-Host 'Verifying live proxy liveness via /api/v1/system/health ...'
$healthPayload = Wait-ForProxyStatus -Path '/api/v1/system/health' -ExpectedStatus 'ok' -Label 'Proxy liveness'
Write-Host ('OK /api/v1/system/health -> status=' + $healthPayload.status)

Write-Host 'Verifying live proxy readiness via /api/v1/system/ready ...'
$readyPayload = Wait-ForProxyStatus -Path '/api/v1/system/ready' -ExpectedStatus 'ready' -Label 'Proxy readiness'
Write-Host ('OK /api/v1/system/ready -> status=' + $readyPayload.status)

Write-Host 'Verifying frontend build provenance via /internal/frontend-build ...'
$buildPayload = Assert-FrontendBuildId -ExpectedBuildId $env:APP_BUILD_ID
$buildIdSource = if ($null -ne $buildPayload.build_id_source -and -not [string]::IsNullOrWhiteSpace([string] $buildPayload.build_id_source)) { [string] $buildPayload.build_id_source } else { '<null>' }
Write-Host ('OK /internal/frontend-build -> NEXT_PUBLIC_APP_BUILD_ID=' + $buildPayload.NEXT_PUBLIC_APP_BUILD_ID + ' (source=' + $buildIdSource + ')')

Write-Host 'Done. Open https://ancap.cloud/bridge/acp-bsc -- if still 404, first confirm the verified build id at https://ancap.cloud/internal/frontend-build before blaming cache.'
