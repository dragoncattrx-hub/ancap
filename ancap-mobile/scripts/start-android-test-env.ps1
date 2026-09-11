# Start local Android test environment for ACP Wallet (clears "no device / no test env" blocker).
# Usage: powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1
$ErrorActionPreference = "Stop"

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "$env:LOCALAPPDATA\Android\Sdk" }
$adb = Join-Path $sdk "platform-tools\adb.exe"
$emu = Join-Path $sdk "emulator\emulator.exe"
$avd = if ($env:ANCAP_ANDROID_AVD) { $env:ANCAP_ANDROID_AVD } else { "Pixel_10_Pro" }

if (-not (Test-Path $adb)) { throw "adb not found at $adb" }
if (-not (Test-Path $emu)) { throw "emulator not found at $emu" }

$env:Path = "$(Join-Path $sdk 'platform-tools');$(Join-Path $sdk 'emulator');$env:Path"

$devices = & $adb devices
$ready = $devices | Where-Object { $_ -match 'emulator-\d+\s+device' }
if (-not $ready) {
  Write-Host "Starting AVD $avd ..."
  Start-Process -FilePath $emu -ArgumentList @("-avd", $avd, "-netdelay", "none", "-netspeed", "full") -WindowStyle Minimized
  $deadline = (Get-Date).AddMinutes(4)
  do {
    Start-Sleep -Seconds 5
    $devices = & $adb devices
    $ready = $devices | Where-Object { $_ -match 'emulator-\d+\s+device' }
    Write-Host ("waiting... " + (($devices | Out-String).Trim()))
  } while (-not $ready -and (Get-Date) -lt $deadline)
}

if (-not $ready) { throw "Emulator did not become ready in time. Check Android Studio AVD Manager for $avd." }

Write-Host "Android test environment READY:"
& $adb devices -l
Write-Host "Next: cd ancap-mobile/apps/acp-wallet-expo ; npx expo run:android"
Write-Host "Store uploads (Play/TestFlight) remain operator follow-up - not a local runtime blocker."
