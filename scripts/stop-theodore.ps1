# Stop Theodore completely and remove Windows autostart / persistence.
#
# Run once on the operator Windows host (elevated recommended):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-theodore.ps1
#
# What this does:
# - Creates memory/theodore.disabled kill-switch (promo script exits immediately)
# - Stops/disables/unregisters Scheduled Tasks matching Theodore / OpenClaw / ANCAP automation
# - Removes Startup-folder shortcuts and HKCU/HKLM Run entries for Theodore / OpenClaw / ANCAP daemon
# - Stops running processes whose command line points at Theodore / openclaw / ANCAP daemon scripts
# - Attempts to stop a local OpenClaw gateway if it is listening / registered as a service

$ErrorActionPreference = "Continue"

$RepoRoot = if ($env:ANCAP_REPO_ROOT) {
  $env:ANCAP_REPO_ROOT
} elseif ($PSScriptRoot) {
  Split-Path -Parent $PSScriptRoot
} else {
  (Get-Location).Path
}

$LogDir = Join-Path $RepoRoot "memory"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
$LogPath = Join-Path $LogDir "theodore-stop.log"
$KillSwitch = Join-Path $LogDir "theodore.disabled"

function Write-StopLog([string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date).ToString("o"), $Message
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $line
}

Write-StopLog "=== Theodore full stop begin repo=$RepoRoot ==="

# 1) Permanent kill-switch for the promo script (even if something relaunches it).
@(
  "Theodore disabled by operator",
  ("disabledAt={0}" -f (Get-Date).ToString("o")),
  "host=$env:COMPUTERNAME",
  "user=$env:USERDOMAIN\$env:USERNAME"
) | Set-Content -Path $KillSwitch -Encoding UTF8
Write-StopLog "Kill-switch written: $KillSwitch"

# 2) Scheduled Tasks — stop, disable, unregister.
$taskNamePatterns = @(
  '*Theodore*',
  '*theodore*',
  '*OpenClaw*',
  '*openclaw*',
  'ANCAP-Heartbeat',
  'ANCAP-Posting',
  'ANCAP-Theodore*',
  'ANCAP-Daemon*',
  'ANCAP-Earn*'
)

$tasks = @()
try {
  $tasks = @(Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {
    $name = $_.TaskName
    foreach ($pat in $taskNamePatterns) {
      if ($name -like $pat) { return $true }
    }
    # Also catch tasks whose action points at Theodore / openclaw scripts.
    try {
      $actions = @($_.Actions)
      foreach ($a in $actions) {
        $blob = (("" + $a.Execute) + " " + ("" + $a.Arguments))
        if ($blob -match '(?i)theodore|openclaw|heartbeat-ancap|post-news|daemon\.ps1|theodore-earn') {
          return $true
        }
      }
    } catch { }
    return $false
  })
} catch {
  Write-StopLog "WARN Get-ScheduledTask failed: $($_.Exception.Message)"
}

foreach ($task in $tasks) {
  $full = $task.TaskPath + $task.TaskName
  try {
    Stop-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction SilentlyContinue
    Disable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Confirm:$false -ErrorAction SilentlyContinue
    Write-StopLog "Removed scheduled task: $full"
  } catch {
    Write-StopLog "WARN could not remove task $full : $($_.Exception.Message)"
  }
}

if ($tasks.Count -eq 0) {
  Write-StopLog "No matching Scheduled Tasks found (ok if already clean)."
}

# 3) Startup folder shortcuts / scripts.
$startupDirs = @(
  [Environment]::GetFolderPath('Startup'),
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp"
) | Where-Object { $_ -and (Test-Path $_) }

foreach ($dir in $startupDirs) {
  Get-ChildItem -Path $dir -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '(?i)theodore|openclaw|ancap-daemon|ancap.heartbeat|ancap.posting|heartbeat-ancap|post-news|theodore-earn'
  } | ForEach-Object {
    try {
      Remove-Item -LiteralPath $_.FullName -Force
      Write-StopLog "Removed Startup entry: $($_.FullName)"
    } catch {
      Write-StopLog "WARN could not remove Startup $($_.FullName): $($_.Exception.Message)"
    }
  }
}

# 4) Registry Run / RunOnce (current user + machine if elevated).
$runKeys = @(
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce',
  'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run',
  'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce'
)

foreach ($key in $runKeys) {
  if (-not (Test-Path $key)) { continue }
  try {
    $props = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue
    if (-not $props) { continue }
    $props.PSObject.Properties | Where-Object {
      $_.Name -notmatch '^PS' -and (("" + $_.Name) + " " + ("" + $_.Value)) -match '(?i)theodore|openclaw|ancap\\scripts\\(daemon|heartbeat|post-news|theodore)|ANCAP'
    } | ForEach-Object {
      try {
        Remove-ItemProperty -Path $key -Name $_.Name -Force -ErrorAction Stop
        Write-StopLog "Removed registry $($key)\$($_.Name)"
      } catch {
        Write-StopLog "WARN could not remove registry $($key)\$($_.Name): $($_.Exception.Message)"
      }
    }
  } catch {
    Write-StopLog "WARN registry scan $key : $($_.Exception.Message)"
  }
}

# 5) Stop running processes related to Theodore / OpenClaw / ANCAP automation.
$processNameHints = @('openclaw', 'clawdbot', 'node')
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
  $cmd = "" + $_.CommandLine
  $name = "" + $_.Name
  $hit = $false
  if ($cmd -match '(?i)theodore-earn-promo|theodore\.disabled|openclaw|clawdbot|ANCAP\\scripts\\(daemon|heartbeat-ancap|post-news|theodore)') {
    $hit = $true
  }
  if ($name -match '(?i)^(openclaw|clawdbot)') {
    $hit = $true
  }
  # Do not kill unrelated node processes — only when command line mentions openclaw/theodore.
  if ($hit) {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      Write-StopLog "Killed PID $($_.ProcessId) ($name) :: $cmd"
    } catch {
      Write-StopLog "WARN could not kill PID $($_.ProcessId): $($_.Exception.Message)"
    }
  }
}

# 6) Windows services named OpenClaw / Theodore (if any).
Get-Service -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -match '(?i)openclaw|theodore' -or $_.DisplayName -match '(?i)openclaw|theodore'
} | ForEach-Object {
  try {
    if ($_.Status -eq 'Running') {
      Stop-Service -Name $_.Name -Force -ErrorAction SilentlyContinue
    }
    Set-Service -Name $_.Name -StartupType Disabled -ErrorAction SilentlyContinue
    Write-StopLog "Stopped/disabled service: $($_.Name)"
  } catch {
    Write-StopLog "WARN service $($_.Name): $($_.Exception.Message)"
  }
}

# 7) Best-effort: stop OpenClaw gateway if a CLI is on PATH.
foreach ($cli in @('openclaw', 'clawdbot')) {
  $cmd = Get-Command $cli -ErrorAction SilentlyContinue
  if (-not $cmd) { continue }
  foreach ($args in @(
    @('gateway', 'stop'),
    @('stop'),
    @('daemon', 'stop'),
    @('agent', 'stop', 'Theodore'),
    @('agents', 'stop', 'Theodore')
  )) {
    try {
      & $cli @args 2>&1 | Out-String | ForEach-Object { if ($_) { Write-StopLog "$cli $($args -join ' '): $_" } }
    } catch { }
  }
}

# 8) OpenClaw agent disable marker in the usual Windows home path (if present).
$openclawRoots = @(
  (Join-Path $env:USERPROFILE '.openclaw'),
  (Join-Path $env:USERPROFILE '.clawdbot')
) | Where-Object { $_ -and (Test-Path $_) }

foreach ($root in $openclawRoots) {
  $marker = Join-Path $root 'theodore.disabled'
  try {
    "disabled $(Get-Date -Format o)" | Set-Content -Path $marker -Encoding UTF8
    Write-StopLog "OpenClaw disable marker: $marker"
  } catch {
    Write-StopLog "WARN openclaw marker $root : $($_.Exception.Message)"
  }

  # Disable agent config files that look like Theodore.
  Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '(?i)theodore' -and $_.Extension -match '\.(json|yml|yaml|md|toml)$' } |
    ForEach-Object {
      $disabledPath = $_.FullName + '.disabled-by-operator'
      try {
        if (-not (Test-Path $disabledPath)) {
          Move-Item -LiteralPath $_.FullName -Destination $disabledPath -Force
          Write-StopLog "Renamed agent config: $($_.FullName) -> $disabledPath"
        }
      } catch {
        Write-StopLog "WARN rename $($_.FullName): $($_.Exception.Message)"
      }
    }
}

Write-StopLog "=== Theodore full stop complete ==="
Write-Host ""
Write-Host "Theodore stopped. Autostart entries removed where found."
Write-Host "Kill-switch: $KillSwitch"
Write-Host "Log: $LogPath"
Write-Host "Reboot once if a stubborn tray/gateway process remains, then re-run this script."
)
