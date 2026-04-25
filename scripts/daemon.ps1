# ANCAP Automation Daemon
# Runs heartbeat and posting in background with 3-hour intervals

$ErrorActionPreference = "Stop"

Write-Host "🛰️ ANCAP Automation Daemon Starting..."
Write-Host "Heartbeat: Every 3 hours"
Write-Host "Posting: Every 3 hours (offset +30min)"
Write-Host "Press Ctrl+C to stop"
Write-Host ""

# Initialize state
$stateFile = "C:\Users\drago\Desktop\ANCAP\memory\daemon-state.json"
$state = @{
    started = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    lastHeartbeat = $null
    lastPosting = $null
    heartbeatCount = 0
    postingCount = 0
}

# Load previous state if exists
if (Test-Path $stateFile) {
    try {
        $prevState = Get-Content $stateFile -Raw | ConvertFrom-Json
        $state.heartbeatCount = $prevState.heartbeatCount
        $state.postingCount = $prevState.postingCount
    } catch {
        Write-Host "Warning: Could not load previous state"
    }
}

# Save state function
function Save-State {
    try {
        $stateDir = Split-Path $stateFile -Parent
        if (-not (Test-Path $stateDir)) {
            New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
        }
        $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
    } catch {
        Write-Host "Warning: Could not save state: $_"
    }
}

# Heartbeat function
function Run-Heartbeat {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Running heartbeat..."
    try {
        & "C:\Users\drago\Desktop\ANCAP\scripts\heartbeat-ancap.ps1"
        $state.lastHeartbeat = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $state.heartbeatCount++
        Save-State
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Heartbeat completed"
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Heartbeat failed: $_"
    }
    Write-Host ""
}

# Posting function
function Run-Posting {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Running posting..."
    try {
        & "C:\Users\drago\Desktop\ANCAP\scripts\post-news.ps1"
        $state.lastPosting = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $state.postingCount++
        Save-State
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Posting completed"
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Posting failed: $_"
    }
    Write-Host ""
}

# Run initial heartbeat
Run-Heartbeat

# Wait 30 minutes, then run initial posting
Write-Host "Waiting 30 minutes before first posting..."
Start-Sleep -Seconds 1800
Run-Posting

# Main loop: run every 3 hours
while ($true) {
    Write-Host "Next run in 3 hours ($(Get-Date (Get-Date).AddHours(3) -Format 'HH:mm:ss'))..."
    Start-Sleep -Seconds 10800  # 3 hours
    
    # Run heartbeat
    Run-Heartbeat
    
    # Wait 30 minutes
    Write-Host "Waiting 30 minutes before posting..."
    Start-Sleep -Seconds 1800
    
    # Run posting
    Run-Posting
}
