# Launch Android Studio with project-local Gradle cache (fixes metadata.bin on Windows).
# Usage:
#   .\ancap-mobile\scripts\open-android-studio.ps1
#
# Run fix-gradle-cache.ps1 first if sync previously failed.

$ErrorActionPreference = "Stop"

$mobileRoot = Split-Path $PSScriptRoot -Parent
$androidRoot = Join-Path $mobileRoot "apps\acp-wallet-expo\android"
$localGradleHome = "C:\gradle-ancap"

if (-not (Test-Path $androidRoot)) {
    Write-Error "Android project not found at $androidRoot"
}

$studioExe = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (-not (Test-Path $studioExe)) {
    Write-Error "Android Studio not found at $studioExe"
}

if (-not (Test-Path $localGradleHome)) {
    New-Item -ItemType Directory -Path $localGradleHome -Force | Out-Null
}

$env:GRADLE_USER_HOME = $localGradleHome
Write-Host "GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Host "Opening Android Studio with project: $androidRoot"

Start-Process -FilePath $studioExe -ArgumentList @($androidRoot)

Write-Host ""
Write-Host "In Android Studio: File -> Sync Project with Gradle Files"
Write-Host "If sync fails, close Studio and run: .\ancap-mobile\scripts\fix-gradle-cache.ps1"
