# Start local Android test environment for ACP Wallet (clears "no device / no test env" blocker).
# Usage:
#   powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1
#   powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1 -Restart
#   powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1 -WipeData
param(
  [switch]$Restart,
  [switch]$WipeData
)

$ErrorActionPreference = "Stop"

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "$env:LOCALAPPDATA\Android\Sdk" }
$adb = Join-Path $sdk "platform-tools\adb.exe"
$emu = Join-Path $sdk "emulator\emulator.exe"
$avd = if ($env:ANCAP_ANDROID_AVD) { $env:ANCAP_ANDROID_AVD } else { "Pixel_10_Pro" }

if (-not (Test-Path $adb)) { throw "adb not found at $adb" }
if (-not (Test-Path $emu)) { throw "emulator not found at $emu" }

$env:Path = "$(Join-Path $sdk 'platform-tools');$(Join-Path $sdk 'emulator');$env:Path"

function Get-ReadyEmulators {
  $lines = & $adb devices
  @($lines | Where-Object { $_ -match 'emulator-\d+\s+device' })
}

function Stop-AndroidEmulatorStack {
  Write-Host "Stopping hung emulator / adb stack..."
  try { & $adb emu kill 2>$null } catch {}
  try { & $adb kill-server 2>$null } catch {}
  Start-Sleep -Seconds 2
  Get-Process -Name "qemu-system-x86_64","emulator","adb" -ErrorAction SilentlyContinue |
    ForEach-Object {
      try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
  Start-Sleep -Seconds 2
  & $adb start-server | Out-Null
}

if ($Restart -or $WipeData) {
  Stop-AndroidEmulatorStack
}

$ready = Get-ReadyEmulators
# Detect zombie: adb says device but boot props hang / shell dead
if ($ready) {
  $bootOk = $false
  try {
    $boot = & $adb shell getprop sys.boot_completed 2>$null
    $bootOk = (($boot | Out-String).Trim() -eq "1")
  } catch {
    $bootOk = $false
  }
  if (-not $bootOk) {
    Write-Host "Emulator listed but not booted cleanly - restarting."
    Stop-AndroidEmulatorStack
    $ready = @()
  }
}

if (-not $ready) {
  Write-Host "Starting AVD $avd ..."
  $emuArgs = @("-avd", $avd, "-netdelay", "none", "-netspeed", "full")
  if ($WipeData) {
    $emuArgs += "-wipe-data"
    Write-Host "Cold boot with -wipe-data (factory reset AVD data)."
  }
  Start-Process -FilePath $emu -ArgumentList $emuArgs -WindowStyle Minimized
  $deadline = (Get-Date).AddMinutes(5)
  do {
    Start-Sleep -Seconds 5
    $ready = Get-ReadyEmulators
    Write-Host ("waiting... " + ((& $adb devices | Out-String).Trim()))
  } while (-not $ready -and (Get-Date) -lt $deadline)
}

if (-not $ready) { throw "Emulator did not become ready in time. Check Android Studio AVD Manager for $avd." }

$bootDeadline = (Get-Date).AddMinutes(3)
do {
  $boot = ((& $adb shell getprop sys.boot_completed 2>$null) | Out-String).Trim()
  if ($boot -eq "1") { break }
  Start-Sleep -Seconds 3
} while ((Get-Date) -lt $bootDeadline)

if ($boot -ne "1") {
  throw "Emulator device up but sys.boot_completed != 1. Re-run with -Restart or -WipeData."
}

Write-Host "Android test environment READY:"
& $adb devices -l
Write-Host "Next: cd ancap-mobile/apps/acp-wallet-expo ; npx expo run:android"
Write-Host "If UI freezes again: re-run this script with -Restart (or -WipeData for factory reset)."
Write-Host "Store uploads (Play/TestFlight) remain operator follow-up - not a local runtime blocker."
