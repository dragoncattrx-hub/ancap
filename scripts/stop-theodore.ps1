# Stop Theodore completely and remove Windows autostart / persistence.
# Compatible with Windows PowerShell 5.1.
#
# Run once on the operator Windows host (elevated recommended):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-theodore.ps1

$ErrorActionPreference = "Continue"

if ($env:ANCAP_REPO_ROOT) {
  $RepoRoot = $env:ANCAP_REPO_ROOT
} elseif ($PSScriptRoot) {
  $RepoRoot = Split-Path -Parent $PSScriptRoot
} else {
  $RepoRoot = (Get-Location).Path
}

$LogDir = Join-Path $RepoRoot "memory"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
$LogPath = Join-Path $LogDir "theodore-stop.log"
$KillSwitch = Join-Path $LogDir "theodore.disabled"

function Write-StopLog {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date).ToString("o"), $Message
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $line
}

Write-StopLog "=== Theodore full stop begin repo=$RepoRoot ==="

# 1) Kill-switch so theodore-earn-promo.ps1 exits immediately if relaunched.
$killLines = @(
  "Theodore disabled by operator",
  ("disabledAt={0}" -f (Get-Date).ToString("o")),
  ("host={0}" -f $env:COMPUTERNAME),
  ("user={0}\{1}" -f $env:USERDOMAIN, $env:USERNAME)
)
$killLines | Set-Content -Path $KillSwitch -Encoding UTF8
Write-StopLog "Kill-switch written: $KillSwitch"

# 2) Known task names first (exact match from operator host).
$exactTaskNames = @(
  "TheodoreACPEarnPromo",
  "OpenClaw Gateway",
  "ANCAP-Heartbeat",
  "ANCAP-Posting",
  "ANCAP-Daemon",
  "ANCAP-Earn"
)

foreach ($taskName in $exactTaskNames) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if (-not $task) { continue }
  $full = $task.TaskPath + $task.TaskName
  try {
    Stop-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction SilentlyContinue
    Disable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Confirm:$false -ErrorAction SilentlyContinue
    Write-StopLog "Removed scheduled task: $full"
  } catch {
    Write-StopLog ("WARN could not remove task {0} : {1}" -f $full, $_.Exception.Message)
  }
}

# Also catch wildcard / action-based matches.
$taskNamePatterns = @(
  "*Theodore*",
  "*theodore*",
  "*OpenClaw*",
  "*openclaw*",
  "ANCAP-Theodore*",
  "ANCAP-Daemon*",
  "ANCAP-Earn*"
)

$tasks = @()
try {
  $allTasks = @(Get-ScheduledTask -ErrorAction SilentlyContinue)
  foreach ($t in $allTasks) {
    $name = $t.TaskName
    $match = $false
    foreach ($pat in $taskNamePatterns) {
      if ($name -like $pat) { $match = $true; break }
    }
    if (-not $match) {
      try {
        foreach ($a in @($t.Actions)) {
          $blob = ("" + $a.Execute) + " " + ("" + $a.Arguments)
          if ($blob -match "theodore|openclaw|heartbeat-ancap|post-news|daemon\.ps1|theodore-earn") {
            $match = $true
            break
          }
        }
      } catch {
        # ignore action inspect errors
      }
    }
    if ($match) { $tasks += $t }
  }
} catch {
  Write-StopLog ("WARN Get-ScheduledTask failed: {0}" -f $_.Exception.Message)
}

foreach ($task in $tasks) {
  $full = $task.TaskPath + $task.TaskName
  try {
    Stop-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction SilentlyContinue
    Disable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Confirm:$false -ErrorAction SilentlyContinue
    Write-StopLog "Removed scheduled task: $full"
  } catch {
    Write-StopLog ("WARN could not remove task {0} : {1}" -f $full, $_.Exception.Message)
  }
}

# 3) Startup folder shortcuts / scripts.
$startupDirs = @(
  [Environment]::GetFolderPath("Startup"),
  (Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs\StartUp")
)

foreach ($dir in $startupDirs) {
  if (-not $dir) { continue }
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem -Path $dir -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match "theodore|openclaw|ancap-daemon|ancap.heartbeat|ancap.posting|heartbeat-ancap|post-news|theodore-earn"
  } | ForEach-Object {
    try {
      Remove-Item -LiteralPath $_.FullName -Force
      Write-StopLog ("Removed Startup entry: {0}" -f $_.FullName)
    } catch {
      Write-StopLog ("WARN could not remove Startup {0}: {1}" -f $_.FullName, $_.Exception.Message)
    }
  }
}

# 4) Registry Run / RunOnce.
$runKeys = @(
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run",
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce"
)

foreach ($key in $runKeys) {
  if (-not (Test-Path $key)) { continue }
  try {
    $props = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue
    if (-not $props) { continue }
    foreach ($p in $props.PSObject.Properties) {
      if ($p.Name -match "^PS") { continue }
      $blob = ("" + $p.Name) + " " + ("" + $p.Value)
      if ($blob -notmatch "theodore|openclaw|ANCAP|heartbeat|post-news|daemon") { continue }
      try {
        Remove-ItemProperty -Path $key -Name $p.Name -Force -ErrorAction Stop
        Write-StopLog ("Removed registry {0}\{1}" -f $key, $p.Name)
      } catch {
        Write-StopLog ("WARN could not remove registry {0}\{1}: {2}" -f $key, $p.Name, $_.Exception.Message)
      }
    }
  } catch {
    Write-StopLog ("WARN registry scan {0} : {1}" -f $key, $_.Exception.Message)
  }
}

# 5) Kill matching processes.
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
  $cmd = "" + $_.CommandLine
  $name = "" + $_.Name
  $hit = $false
  if ($cmd -match "theodore-earn-promo|theodore\.disabled|openclaw|clawdbot|ANCAP\\scripts\\(daemon|heartbeat-ancap|post-news|theodore)") {
    $hit = $true
  }
  if ($name -match "^(openclaw|clawdbot)") {
    $hit = $true
  }
  if ($hit) {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      Write-StopLog ("Killed PID {0} ({1}) :: {2}" -f $_.ProcessId, $name, $cmd)
    } catch {
      Write-StopLog ("WARN could not kill PID {0}: {1}" -f $_.ProcessId, $_.Exception.Message)
    }
  }
}

# 6) Windows services.
Get-Service -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -match "openclaw|theodore" -or $_.DisplayName -match "openclaw|theodore"
} | ForEach-Object {
  try {
    if ($_.Status -eq "Running") {
      Stop-Service -Name $_.Name -Force -ErrorAction SilentlyContinue
    }
    Set-Service -Name $_.Name -StartupType Disabled -ErrorAction SilentlyContinue
    Write-StopLog ("Stopped/disabled service: {0}" -f $_.Name)
  } catch {
    Write-StopLog ("WARN service {0}: {1}" -f $_.Name, $_.Exception.Message)
  }
}

# 7) Best-effort OpenClaw CLI stop.
$cliNames = @("openclaw", "clawdbot")
foreach ($cli in $cliNames) {
  $cmdInfo = Get-Command $cli -ErrorAction SilentlyContinue
  if (-not $cmdInfo) { continue }
  $argSets = @(
    @("gateway", "stop"),
    @("stop"),
    @("daemon", "stop"),
    @("agent", "stop", "Theodore"),
    @("agents", "stop", "Theodore")
  )
  foreach ($argSet in $argSets) {
    try {
      $out = & $cli @argSet 2>&1 | Out-String
      if ($out) {
        Write-StopLog ("{0} {1}: {2}" -f $cli, ($argSet -join " "), $out.Trim())
      }
    } catch {
      # ignore CLI errors
    }
  }
}

# 8) OpenClaw home markers / Theodore agent configs.
$openclawRoots = @(
  (Join-Path $env:USERPROFILE ".openclaw"),
  (Join-Path $env:USERPROFILE ".clawdbot")
)

foreach ($root in $openclawRoots) {
  if (-not (Test-Path $root)) { continue }
  $marker = Join-Path $root "theodore.disabled"
  try {
    ("disabled {0}" -f (Get-Date -Format o)) | Set-Content -Path $marker -Encoding UTF8
    Write-StopLog ("OpenClaw disable marker: {0}" -f $marker)
  } catch {
    Write-StopLog ("WARN openclaw marker {0} : {1}" -f $root, $_.Exception.Message)
  }

  Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "theodore" -and $_.Extension -match "\.(json|yml|yaml|md|toml)$" } |
    ForEach-Object {
      $disabledPath = $_.FullName + ".disabled-by-operator"
      try {
        if (-not (Test-Path $disabledPath)) {
          Move-Item -LiteralPath $_.FullName -Destination $disabledPath -Force
          Write-StopLog ("Renamed agent config: {0} -> {1}" -f $_.FullName, $disabledPath)
        }
      } catch {
        Write-StopLog ("WARN rename {0}: {1}" -f $_.FullName, $_.Exception.Message)
      }
    }
}

Write-StopLog "=== Theodore full stop complete ==="
Write-Host ""
Write-Host "Theodore stopped. Autostart entries removed where found."
Write-Host ("Kill-switch: {0}" -f $KillSwitch)
Write-Host ("Log: {0}" -f $LogPath)
Write-Host "Reboot once if a stubborn tray/gateway process remains, then re-run this script."
