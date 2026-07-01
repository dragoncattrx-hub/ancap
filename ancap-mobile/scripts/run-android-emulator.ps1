# Build, install, and launch ANCAP ACP Wallet on the Android emulator.
# Closes Android Studio first to avoid Gradle transform cache races on Windows.
#
# Usage:
#   .\ancap-mobile\scripts\run-android-emulator.ps1
#   .\ancap-mobile\scripts\run-android-emulator.ps1 -WithMetro   # live reload

param(
    [switch] $WithMetro
)

$ErrorActionPreference = "Stop"

$mobileRoot = Split-Path $PSScriptRoot -Parent
$appRoot = Join-Path $mobileRoot "apps\acp-wallet-expo"
$androidRoot = Join-Path $appRoot "android"
$localGradleHome = "C:\gradle-ancap"
$apk = Join-Path $androidRoot "app\build\outputs\apk\debug\app-debug.apk"
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$jdk17 = "C:\jdk-17"

function Stop-StudioAndGradle {
    Get-Process -Name "studio64" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Closing Android Studio (PID $($_.Id)) ..."
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Get-Process -Name "java" -ErrorAction SilentlyContinue | ForEach-Object {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmd -match "GradleDaemon|org\.gradle|kotlin-daemon") {
            Write-Host "Stopping Gradle Java PID $($_.Id)"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
    if (Test-Path (Join-Path $androidRoot "gradlew.bat")) {
        Push-Location $androidRoot
        try { & .\gradlew.bat --stop 2>$null | Out-Null } catch { }
        Pop-Location
    }
    Get-ChildItem "C:\gradle-ancap\caches" -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 3
}

function Clear-BuildCaches {
    $paths = @(
        "C:\gradle-ancap\caches\8.10.2",
        (Join-Path $androidRoot "app\build"),
        (Join-Path $androidRoot "build"),
        (Join-Path $mobileRoot "node_modules\expo-modules-core\android\build"),
        (Join-Path $mobileRoot "node_modules\expo-modules-core\android\.cxx"),
        (Join-Path $androidRoot "app\.cxx")
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            Write-Host "Clearing $p"
            Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        }
    }
}

function Start-MetroIfNeeded {
    if (-not $WithMetro) { return }
    $existing = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Metro already listening on :8081"
        return
    }
    Write-Host "Starting Metro (dev client) in background ..."
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass",
        "-Command", "cd '$appRoot'; npx expo start --dev-client --port 8081"
    ) -WindowStyle Minimized
    Start-Sleep -Seconds 8
}

Stop-StudioAndGradle
Clear-BuildCaches

if (-not (Test-Path (Join-Path $jdk17 "bin\java.exe"))) { Write-Error "JDK 17 not found at $jdk17" }
$env:JAVA_HOME = $jdk17
$env:GRADLE_USER_HOME = $localGradleHome

Write-Host "Building debug APK (embedded JS bundle) ..."
Push-Location $androidRoot
& .\gradlew.bat :app:assembleDebug --no-daemon --no-parallel --no-build-cache --rerun-tasks
$exit = $LASTEXITCODE
Pop-Location
if ($exit -ne 0) { exit $exit }
if (-not (Test-Path $apk)) { Write-Error "APK not found at $apk" }

if (-not (Test-Path $adb)) { Write-Error "adb not found at $adb" }
$devices = & $adb devices | Select-String "device$"
if (-not $devices) { Write-Error "No Android emulator/device connected. Start an AVD first." }

Start-MetroIfNeeded
& $adb reverse tcp:8081 tcp:8081 2>$null | Out-Null

Write-Host "Installing APK ..."
& $adb install -r $apk
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Launching wallet ..."
& $adb shell am start -n cloud.ancap.acpwallet/.MainActivity
Write-Host ""
Write-Host "Done. Wallet UI loads from embedded bundle (no dev launcher screen)."
if ($WithMetro) {
    Write-Host "Metro is running for live reload (shake device or press m in Metro terminal)."
} else {
    Write-Host "For live reload: .\ancap-mobile\scripts\run-android-emulator.ps1 -WithMetro"
}
