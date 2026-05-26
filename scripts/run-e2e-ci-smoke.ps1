param(
    [string]$ProjectName = "ancap-e2e-ci",
    # Match GitHub frontend-ci defaults by default so local smoke reproduces the
    # real CI origin/port behavior unless explicitly overridden.
    [int]$ApiPort = 8001,
    [int]$PostgresPort = 55432,
    [int]$RedisPort = 56379,
    [int]$FrontendPort = 3001,
    [switch]$KeepStack,
    [switch]$SkipBrowserInstall,
    [switch]$SkipNpmCi
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\")).Path
$frontendDir = Join-Path $repoRoot "frontend-app"
$runStamp = "{0}-{1}" -f (Get-Date -Format "yyyyMMdd-HHmmss-fff"), $PID
$frontendStdoutLog = Join-Path $repoRoot ("frontend-e2e-server.{0}.log" -f $runStamp)
$frontendStderrLog = Join-Path $repoRoot ("frontend-e2e-server.{0}.err.log" -f $runStamp)
$frontendProcess = $null
$frontendPortProcess = $null

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
            $content = & curl.exe --silent --show-error --fail --max-time 5 $Url 2>$null
            if ($LASTEXITCODE -eq 0) {
                return $content
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
            $content = & curl.exe --silent --show-error --fail --max-time 5 $Url 2>$null
            if ($LASTEXITCODE -eq 0 -and $content) {
                $response = $content | ConvertFrom-Json
                if ($null -ne $response -and $response.status -eq $ExpectedStatus) {
                    return $response
                }
            }
        }
        catch {
        }
        Start-Sleep -Seconds $IntervalSeconds
    } while ((Get-Date) -lt $deadline)

    throw "Timed out waiting for status '$ExpectedStatus' from $Url"
}

function Get-ListeningProcessForPort {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    try {
        $connection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop | Select-Object -First 1
    }
    catch {
        return $null
    }

    if (-not $connection) {
        return $null
    }

    $processInfo = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $connection.OwningProcess) -ErrorAction SilentlyContinue
    return [PSCustomObject]@{
        ProcessId = $connection.OwningProcess
        Name = if ($processInfo) { $processInfo.Name } else { $null }
        CommandLine = if ($processInfo) { $processInfo.CommandLine } else { $null }
    }
}

function Get-RepoNextProcesses {
    param(
        [Parameter(Mandatory = $true)][string]$FrontendPath
    )

    $normalizedFrontendPath = $FrontendPath.ToLowerInvariant()
    @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $commandLine = if ($null -ne $_.CommandLine) { [string]$_.CommandLine } else { "" }
        $normalizedCommandLine = $commandLine.ToLowerInvariant()
        $normalizedCommandLine.Contains($normalizedFrontendPath) -and $normalizedCommandLine.Contains("next")
    })
}

function Stop-RepoNextServers {
    param(
        [Parameter(Mandatory = $true)][string]$FrontendPath
    )

    $repoNextProcesses = @(Get-RepoNextProcesses -FrontendPath $FrontendPath)
    if ($repoNextProcesses.Count -eq 0) {
        return
    }

    foreach ($processInfo in $repoNextProcesses) {
        Write-Warning ("Stopping stale frontend server from repo build dir (PID={0})." -f $processInfo.ProcessId)
        Stop-Process -Id $processInfo.ProcessId -Force -ErrorAction SilentlyContinue
    }

    $deadline = (Get-Date).AddSeconds(15)
    do {
        Start-Sleep -Milliseconds 250
        $remaining = @(Get-RepoNextProcesses -FrontendPath $FrontendPath)
        if ($remaining.Count -eq 0) {
            return
        }
    } while ((Get-Date) -lt $deadline)

    $remainingSummary = (@(Get-RepoNextProcesses -FrontendPath $FrontendPath) | ForEach-Object { $_.ProcessId }) -join ", "
    throw ("Timed out waiting for stale frontend servers to stop. Remaining PIDs: {0}" -f $remainingSummary)
}

function Stop-StaleFrontendPortOwner {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [Parameter(Mandatory = $true)][string]$FrontendPath
    )

    $owner = Get-ListeningProcessForPort -Port $Port
    if (-not $owner) {
        return $null
    }

    $commandLine = if ($null -ne $owner.CommandLine) { [string]$owner.CommandLine } else { "" }
    $normalizedFrontendPath = $FrontendPath.ToLowerInvariant()
    $normalizedCommandLine = $commandLine.ToLowerInvariant()
    $isRepoNextServer = ($owner.Name -eq "node.exe") -and $normalizedCommandLine.Contains($normalizedFrontendPath) -and $normalizedCommandLine.Contains("next")
    $isGenericNextServerOnTargetPort = ($owner.Name -eq "node.exe") -and $normalizedCommandLine.Contains("node_modules/next/dist/bin/next") -and $normalizedCommandLine.Contains(" start ") -and $normalizedCommandLine.Contains(("-p {0}" -f $Port))

    if ($isRepoNextServer) {
        Stop-RepoNextServers -FrontendPath $FrontendPath
        return Get-ListeningProcessForPort -Port $Port
    }

    if ($isGenericNextServerOnTargetPort) {
        Write-Warning ("Stopping stale Next.js server on target frontend port {0} (PID={1}) before smoke startup." -f $Port, $owner.ProcessId)
        Stop-Process -Id $owner.ProcessId -Force -ErrorAction SilentlyContinue

        $deadline = (Get-Date).AddSeconds(15)
        do {
            Start-Sleep -Milliseconds 250
            $remaining = Get-ListeningProcessForPort -Port $Port
            if (-not $remaining) {
                return $null
            }
        } while ((Get-Date) -lt $deadline)

        return Get-ListeningProcessForPort -Port $Port
    }

    return $owner
}

function Get-DockerContainersPublishingPort {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    $dockerPs = & docker ps --format "{{.Names}}|{{.Ports}}" 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $dockerPs) {
        return @()
    }

    $needle = (":{0}->" -f $Port)
    $matches = @()
    foreach ($line in @($dockerPs)) {
        if (-not $line) {
            continue
        }

        $parts = $line -split '\|', 2
        $name = $parts[0]
        $ports = if ($parts.Count -gt 1) { $parts[1] } else { "" }
        if ($ports.Contains($needle)) {
            $matches += [PSCustomObject]@{
                Name = $name
                Ports = $ports
            }
        }
    }

    return $matches
}

function Assert-DockerPublishedPortAvailable {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string]$PortArgumentName
    )

    $conflicts = @(Get-DockerContainersPublishingPort -Port $Port | Where-Object {
        $_.Name -notlike ("{0}-*" -f $ProjectName)
    })
    if ($conflicts.Count -eq 0) {
        return
    }

    $containerSummary = ($conflicts | ForEach-Object {
        "{0} [{1}]" -f $_.Name, $_.Ports
    }) -join "; "

    throw (
        "Target {0} port {1} is already published by Docker container(s): {2}. " -f $Label, $Port, $containerSummary
    ) + (
        "Stop the conflicting stack first (for disposable smoke stacks: docker compose -p <project> down -v) " +
        "or rerun with -{0} <free-port>." -f $PortArgumentName
    )
}

try {
    Assert-DockerPublishedPortAvailable -Port $ApiPort -Label "API" -ProjectName $ProjectName -PortArgumentName "ApiPort"
    Assert-DockerPublishedPortAvailable -Port $PostgresPort -Label "Postgres" -ProjectName $ProjectName -PortArgumentName "PostgresPort"
    Assert-DockerPublishedPortAvailable -Port $RedisPort -Label "Redis" -ProjectName $ProjectName -PortArgumentName "RedisPort"

    $env:API_PORT = "$ApiPort"
    $env:POSTGRES_PORT = "$PostgresPort"
    $env:REDIS_PORT = "$RedisPort"
    $env:PARTICIPATION_GATES_ENABLED = "false"
    $defaultCorsOrigins = @(
        "https://ancap.cloud",
        "https://www.ancap.cloud",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3201",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3201",
        "http://localhost:$FrontendPort",
        "http://127.0.0.1:$FrontendPort"
    )
    $env:CORS_ORIGINS = (($defaultCorsOrigins | Where-Object { $_ } | Select-Object -Unique) -join ",")

    # This smoke stack is disposable. Always force-recreate it so stale containers
    # from older runs cannot keep the default port bindings (for example 8001)
    # and make the health wait loop poll the wrong host port.
    Invoke-CheckedCommand -Command "docker" -Arguments @("compose", "-p", $ProjectName, "up", "-d", "--force-recreate", "--remove-orphans", "postgres", "redis", "api")
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

    # next build and next start share the same .next output directory.
    # Stale repo-local next servers on any port can race with rebuilds and cause
    # intermittent ENOENT/rename failures inside .next (for example 500.html).
    Stop-RepoNextServers -FrontendPath $frontendDir

    Invoke-CheckedCommand -Command "npm" -Arguments @("run", "build") -WorkingDirectory $frontendDir

    if (-not $SkipBrowserInstall) {
        Invoke-CheckedCommand -Command "npx" -Arguments @("playwright", "install", "chromium") -WorkingDirectory $frontendDir
    }

    $frontendPortOwner = Stop-StaleFrontendPortOwner -Port $FrontendPort -FrontendPath $frontendDir
    if ($frontendPortOwner) {
        $processSummary = "PID={0}" -f $frontendPortOwner.ProcessId
        if ($frontendPortOwner.Name) {
            $processSummary += ", Name={0}" -f $frontendPortOwner.Name
        }
        if ($frontendPortOwner.CommandLine) {
            $processSummary += ", CommandLine={0}" -f $frontendPortOwner.CommandLine
        }
        throw ("Frontend port {0} is already in use before smoke startup ({1}). Stop the stale process or rerun with -FrontendPort <free-port>." -f $FrontendPort, $processSummary)
    }

    Write-Host ("Frontend logs: stdout={0} stderr={1}" -f $frontendStdoutLog, $frontendStderrLog)

    $frontendProcess = Start-Process -FilePath $nextCli `
        -ArgumentList @("start", "-p", "$FrontendPort") `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput $frontendStdoutLog `
        -RedirectStandardError $frontendStderrLog `
        -PassThru

    Wait-HttpOk -Url ("http://127.0.0.1:{0}" -f $FrontendPort) -TimeoutSeconds 90
    $frontendPortProcess = Get-ListeningProcessForPort -Port $FrontendPort

    $env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:$FrontendPort"
    $env:PLAYWRIGHT_UI_BASE_URL = "http://127.0.0.1:$FrontendPort"
    $env:PLAYWRIGHT_API_BASE_URL = "http://127.0.0.1:$ApiPort/v1"

    Invoke-CheckedCommand -Command "npx" -Arguments @("playwright", "test") -WorkingDirectory $frontendDir
}
finally {
    $frontendCleanupIds = @()
    if ($frontendProcess) {
        $frontendCleanupIds += [int]$frontendProcess.Id
    }
    if ($frontendPortProcess -and $frontendPortProcess.ProcessId) {
        $frontendCleanupIds += [int]$frontendPortProcess.ProcessId
    }

    foreach ($processId in ($frontendCleanupIds | Select-Object -Unique)) {
        try {
            $processToStop = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($processToStop) {
                Stop-Process -Id $processId -Force
                $processToStop.WaitForExit()
            }
        }
        catch {
            Write-Warning $_
        }
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
