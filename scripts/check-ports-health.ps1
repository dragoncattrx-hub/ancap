# Quick ANCAP ports + health report
# Usage:
#   powershell -ExecutionPolicy Bypass -File "scripts/check-ports-health.ps1"

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$timestamp] ANCAP Ports and Health Report"
Write-Host ("=" * 72)

# Ports that matter for local ANCAP workflows.
$portChecks = @(
    @{ Name = "Frontend dev"; Port = 3001; Expected = "next dev" },
    @{ Name = "Gateway proxy"; Port = 8080; Expected = "ancap-proxy/nginx" },
    @{ Name = "PostgreSQL"; Port = 5432; Expected = "postgres" },
    @{ Name = "SearXNG"; Port = 9080; Expected = "searxng" }
)

Write-Host ""
Write-Host "Listening ports:"

$portResults = @()
foreach ($check in $portChecks) {
    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq $check.Port }

    if (-not $listeners) {
        Write-Host ("[FAIL] {0} ({1}): not listening" -f $check.Name, $check.Port)
        $portResults += [PSCustomObject]@{
            Name = $check.Name
            Port = $check.Port
            Ok = $false
            Details = "not listening"
        }
        continue
    }

    $procIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    $procNames = @()
    foreach ($procId in $procIds) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            $procNames += "$($proc.ProcessName)#$procId"
        } else {
            $procNames += "pid#$procId"
        }
    }
    $detail = ($procNames -join ", ")
    Write-Host ("[OK]   {0} ({1}): {2}" -f $check.Name, $check.Port, $detail)

    $portResults += [PSCustomObject]@{
        Name = $check.Name
        Port = $check.Port
        Ok = $true
        Details = $detail
    }
}

Write-Host ""
Write-Host "HTTP probes:"

$httpChecks = @(
    @{ Name = "Frontend"; Url = "http://localhost:3001/"; Expect = 200 },
    @{ Name = "Gateway"; Url = "http://localhost:8080/"; Expect = 200 },
    @{ Name = "API health"; Url = "http://localhost:8080/api/system/health"; Expect = 200 },
    @{ Name = "OpenAPI"; Url = "http://localhost:8080/openapi.json"; Expect = 200 },
    @{ Name = "Swagger"; Url = "http://localhost:8080/api/docs"; Expect = 200 },
    @{ Name = "Protected users/me"; Url = "http://localhost:8080/api/users/me"; Expect = 401 }
)

$httpResults = @()
foreach ($check in $httpChecks) {
    try {
        $response = Invoke-WebRequest -Uri $check.Url -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
        $status = [int]$response.StatusCode
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode.value__ } else { -1 }
    }

    $ok = ($status -eq $check.Expect)
    if ($status -eq -1) {
        Write-Host ("[FAIL] {0}: no response (expected {1})" -f $check.Name, $check.Expect)
        $detail = "no response"
    } else {
        $tag = if ($ok) { "OK" } else { "FAIL" }
        Write-Host ("[{0}] {1}: {2} (expected {3})" -f $tag, $check.Name, $status, $check.Expect)
        $detail = "$status (expected $($check.Expect))"
    }

    $httpResults += [PSCustomObject]@{
        Name = $check.Name
        Url = $check.Url
        Ok = $ok
        Details = $detail
    }
}

Write-Host ""
Write-Host "Docker containers (ancap/searxng):"
try {
    $containers = docker ps --format "{{.Names}}`t{{.Status}}`t{{.Ports}}" |
        Select-String -Pattern "ancap-|searxng"
    if ($containers) {
        $containers | ForEach-Object { Write-Host ("  " + $_.Line) }
        $dockerOk = $true
    } else {
        Write-Host "  no matching containers are running"
        $dockerOk = $false
    }
} catch {
    Write-Host ("  failed to read docker status: {0}" -f $_.Exception.Message)
    $dockerOk = $false
}

$allPortOk = ($portResults | Where-Object { -not $_.Ok }).Count -eq 0
$allHttpOk = ($httpResults | Where-Object { -not $_.Ok }).Count -eq 0
$overallOk = $allPortOk -and $allHttpOk -and $dockerOk

Write-Host ""
Write-Host ("=" * 72)
Write-Host ("Port checks: {0}/{1}" -f (($portResults | Where-Object Ok).Count), $portResults.Count)
Write-Host ("HTTP checks: {0}/{1}" -f (($httpResults | Where-Object Ok).Count), $httpResults.Count)
Write-Host ("Docker check: {0}" -f $(if ($dockerOk) { "OK" } else { "FAIL" }))
Write-Host ("Overall: {0}" -f $(if ($overallOk) { "OK" } else { "FAIL" }))

if (-not $overallOk) {
    exit 1
}
