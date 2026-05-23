# Build libacp_mobile_ffi.so for Android ABIs and copy into expo-acp-core/jniLibs.
# Requires: rustup, Android NDK, cargo-ndk (`cargo install cargo-ndk`)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$crypto = Join-Path $root "ACP-crypto"
$jniRoot = Join-Path $root "ancap-mobile\modules\expo-acp-core\android\src\main\jniLibs"

Set-Location $crypto
rustup target add aarch64-linux-android x86_64-linux-android armv7-linux-androideabi | Out-Null

if (-not $env:ANDROID_HOME -and -not $env:ANDROID_NDK_HOME) {
  Write-Error "Set ANDROID_HOME (Android Studio SDK) before building native libs."
}

if (-not (Get-Command cargo-ndk -ErrorAction SilentlyContinue)) {
  Write-Host "Installing cargo-ndk (needs network)..."
  cargo install cargo-ndk
}

$targets = @(
  @{ abi = "arm64-v8a"; triple = "aarch64-linux-android" },
  @{ abi = "x86_64"; triple = "x86_64-linux-android" },
  @{ abi = "armeabi-v7a"; triple = "armv7-linux-androideabi" }
)

foreach ($t in $targets) {
  Write-Host "Building $($t.triple)..."
  cargo ndk -t $t.abi -o $jniRoot build -p acp-mobile-ffi --release
}

Write-Host "Native libs installed under expo-acp-core/android/src/main/jniLibs"
