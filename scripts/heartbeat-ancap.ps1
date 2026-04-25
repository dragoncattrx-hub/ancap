# ANCAP Heartbeat Script
# Runs every 3 hours to check infrastructure health

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$stateFile = "C:\Users\drago\Desktop\ANCAP\memory\heartbeat-state.json"

# Initialize state
$state = @{
    lastRun = $timestamp
    checks = @{}
    errors = @()
}

# Load previous state if exists
if (Test-Path $stateFile) {
    try {
        $prevState = Get-Content $stateFile -Raw | ConvertFrom-Json
        $state.lastChecks = $prevState.checks
    } catch {
        Write-Host "Warning: Could not load previous state"
    }
}

Write-Host "[$timestamp] ANCAP Heartbeat Check"
Write-Host "=" * 60

# 1. HTTP Probes
$checks = @(
    @{ Name = "Frontend"; URL = "http://localhost:8080/"; Expect = 200 }
    @{ Name = "API Health"; URL = "http://localhost:8080/api/v1/system/health"; Expect = 200 }
    @{ Name = "OpenAPI"; URL = "http://localhost:8080/openapi.json"; Expect = 200 }
    @{ Name = "Swagger"; URL = "http://localhost:8080/api/docs"; Expect = 200 }
    @{ Name = "Protected"; URL = "http://localhost:8080/api/users/me"; Expect = 401 }
    @{ Name = "SearXNG"; URL = "http://localhost:9080"; Expect = 200 }
)

foreach ($check in $checks) {
    try {
        $response = Invoke-WebRequest -Uri $check.URL -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $status = $response.StatusCode
        $result = if ($status -eq $check.Expect) { "OK" } else { "WARN" }
        Write-Host "[$result] $($check.Name): $status (expected $($check.Expect))"
        $state.checks[$check.Name] = @{ status = $status; ok = ($status -eq $check.Expect); timestamp = $timestamp }
    } catch {
        $status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "ERROR" }
        $result = if ($status -eq $check.Expect) { "OK" } else { "FAIL" }
        Write-Host "[$result] $($check.Name): $status (expected $($check.Expect))"
        $state.checks[$check.Name] = @{ status = $status; ok = ($status -eq $check.Expect); timestamp = $timestamp }
        if ($status -ne $check.Expect) {
            $state.errors += "$($check.Name) returned $status, expected $($check.Expect)"
        }
    }
}

# 2. Docker Containers
Write-Host ""
Write-Host "Docker Containers:"
try {
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String -Pattern "ancap-|searxng"
    $containers | ForEach-Object { Write-Host "  $_" }
    $state.checks["Docker"] = @{ ok = $true; timestamp = $timestamp }
} catch {
    Write-Host "  ❌ Error checking Docker: $_"
    $state.errors += "Docker check failed: $_"
    $state.checks["Docker"] = @{ ok = $false; timestamp = $timestamp }
}

# 3. Security Headers
Write-Host ""
Write-Host "Security Headers:"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -Method GET -UseBasicParsing -ErrorAction Stop
    $headers = @(
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security"
    )
    $allPresent = $true
    foreach ($header in $headers) {
        $value = $response.Headers[$header]
        if ($value) {
            Write-Host "  [OK] ${header}: $value"
        } else {
            Write-Host "  [FAIL] ${header}: MISSING"
            $allPresent = $false
            $state.errors += "Security header missing: $header"
        }
    }
    $state.checks["SecurityHeaders"] = @{ ok = $allPresent; timestamp = $timestamp }
} catch {
    Write-Host "  [FAIL] Error checking security headers: $_"
    $state.errors += "Security headers check failed: $_"
    $state.checks["SecurityHeaders"] = @{ ok = $false; timestamp = $timestamp }
}

# 4. Conway Automaton Wallet
Write-Host ""
Write-Host "Conway Automaton Wallet:"
try {
    $walletAddress = "0x71Dbd459568A024893AB2CeD679aF088AF8a647E"
    $rpcUrl = "https://mainnet.base.org"
    
    # Get ETH balance
    $ethPayload = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($walletAddress, "latest")
        id = 1
    } | ConvertTo-Json
    
    $ethResponse = Invoke-RestMethod -Uri $rpcUrl -Method POST -Body $ethPayload -ContentType "application/json" -TimeoutSec 10
    $ethBalanceWei = [bigint]::Parse($ethResponse.result.Substring(2), [System.Globalization.NumberStyles]::HexNumber)
    $ethBalance = [double]($ethBalanceWei / 1e18)
    $ethBalance = [Math]::Round($ethBalance, 8)
    
    Write-Host "  ETH: $ethBalance"
    Write-Host "  Address: $walletAddress"
    
    $state.checks["ConwayWallet"] = @{
        ok = $true
        ethBalance = $ethBalance
        address = $walletAddress
        timestamp = $timestamp
    }
} catch {
    Write-Host "  [FAIL] Error checking wallet: $_"
    $state.errors += "Conway wallet check failed: $_"
    $state.checks["ConwayWallet"] = @{ ok = $false; timestamp = $timestamp }
}

# 5. Summary
Write-Host ""
Write-Host "=" * 60
$okCount = ($state.checks.Values | Where-Object { $_.ok -eq $true }).Count
$totalCount = $state.checks.Count
Write-Host "Summary: $okCount/$totalCount checks passed"

if ($state.errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Errors:"
    $state.errors | ForEach-Object { Write-Host "  - $_" }
}

# Save state
try {
    $stateDir = Split-Path $stateFile -Parent
    if (-not (Test-Path $stateDir)) {
        New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
    }
    $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
    Write-Host ""
    Write-Host "State saved to: $stateFile"
} catch {
    Write-Host "Warning: Could not save state: $_"
}

Write-Host ""
Write-Host "Next check: $(Get-Date (Get-Date).AddHours(3) -Format 'yyyy-MM-dd HH:mm:ss')"
