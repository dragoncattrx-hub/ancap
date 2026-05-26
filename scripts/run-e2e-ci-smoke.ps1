param(
    [string]$ProjectName = "ancap-e2e-ci",
    [int]$ApiPort = 58001,
    [int]$PostgresPort = 55432,
    [int]$RedisPort = 56379,
    [int]$FrontendPort = 3301,
    [switch]$KeepStack,
    [switch]$SkipBrowserInstall,
    [switch]$SkipNpmCi
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\")).Path
$frontendDir = Join-Path $repoRoot "frontend-app"
$frontendStdoutLog = Join-Path $repoRoot "frontend-e2e-server.log"
$frontendStderrLog = Join-Path $repoRoot "frontend-e2e-server.err.log"
$frontendProcess = $null

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [string]$WorkingDirectory = $repoRoot
    )

    Write-Host ("> {0} {1}" -f $Command, ($Arguments -join " "))
    Push-Location $WorkingDirectory
    try {
        & $Command @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw ("Command failed with exit code {0}: {1} {2}" -f $LASTEXITCODE, $Command, ($Arguments -join " "))
        }
    }
    finally {
        Pop-Location
    }
}

function Wait-HttpOk {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSeconds = 120,
        [int]$IntervalSeconds = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                return
            }
        }
        catch {
        }
        Start-Sleep -Seconds $IntervalSeconds
    } while ((Get-Date) -lt $deadline)

    throw "Timed out waiting for HTTP 200 from $Url"
}

function Wait-JsonStatus {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][string]$ExpectedStatus,
        [int]$TimeoutSeconds = 120,
        [int]$IntervalSeconds = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 5
            if ($null -ne $response -and $response.status -eq $ExpectedStatus) {
                return $response
            }
        }
        catch {
        }
        Start-Sleep -Seconds $IntervalSeconds
    } while ((Get-Date) -lt $deadline)

    throw "Timed out waiting for status '$ExpectedStatus' from $Url"
}

try {
    $env:API_PORT = "$ApiPort"
    $env:POSTGRES_PORT = "$PostgresPort"
    $env:REDIS_PORT = "$RedisPort"
    $env:PARTICIPATION_GATES_ENABLED = "false"

    Invoke-CheckedCommand -Command "docker" -Arguments @("compose", "-p", $ProjectName, "up", "-d", "postgres", "redis", "api")
    Wait-HttpOk -Url ("http://127.0.0.1:{0}/v1/system/health" -f $ApiPort)
    Invoke-CheckedCommand -Command "docker" -Arguments @("compose", "-p", $ProjectName, "exec", "-T", "api", "alembic", "upgrade", "head")
    $ready = Wait-JsonStatus -Url ("http://127.0.0.1:{0}/v1/system/ready" -f $ApiPort) -ExpectedStatus "ready"
    Write-Host ("API ready: {0}" -f ($ready | ConvertTo-Json -Compress))

    $nextCli = Join-Path $frontendDir "node_modules\.bin\next.cmd"
    if (-not $SkipNpmCi) {
        if (-not (Test-Path $nextCli)) {
            Invoke-CheckedCommand -Command "npm" -Arguments @("ci") -WorkingDirectory $frontendDir
        }
        else {
            Write-Host "Using existing frontend-app node_modules install. Pass -SkipNpmCi to suppress this check explicitly."
        }
    }

    $env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:$ApiPort/v1"
    $env:NEXT_PUBLIC_ACP_URL = "http://127.0.0.1:$ApiPort/acp"

    Invoke-CheckedCommand -Command "npm" -Arguments @("run", "build") -WorkingDirectory $frontendDir

    if (-not $SkipBrowserInstall) {
        Invoke-CheckedCommand -Command "npx" -Arguments @("playwright", "install", "chromium") -WorkingDirectory $frontendDir
    }

    if (Test-Path $frontendStdoutLog) { Remove-Item $frontendStdoutLog -Force }
    if (Test-Path $frontendStderrLog) { Remove-Item $frontendStderrLog -Force }

    $frontendProcess = Start-Process -FilePath "npx.cmd" `
        -ArgumentList @("next", "start", "-p", "$FrontendPort") `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput $frontendStdoutLog `
        -RedirectStandardError $frontendStderrLog `
        -PassThru

    Wait-HttpOk -Url ("http://127.0.0.1:{0}" -f $FrontendPort) -TimeoutSeconds 90

    $env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:$FrontendPort"
    $env:PLAYWRIGHT_UI_BASE_URL = "http://127.0.0.1:$FrontendPort"
    $env:PLAYWRIGHT_API_BASE_URL = "http://127.0.0.1:$ApiPort/v1"

    Invoke-CheckedCommand -Command "npx" -Arguments @("playwright", "test") -WorkingDirectory $frontendDir
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }

    if (-not $KeepStack) {
        try {
            Invoke-CheckedCommand -Command "docker" -Arguments @("compose", "-p", $ProjectName, "down", "-v")
        }
        catch {
            Write-Warning $_
        }
    }
}
