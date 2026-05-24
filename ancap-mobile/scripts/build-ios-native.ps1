# Build and stage the ACP UniFFI iOS core for expo-acp-core.
# Must run on macOS with Xcode + Rust installed.
# Outputs:
# - ancap-mobile/modules/expo-acp-core/ios/generated/swift/*
# - ancap-mobile/modules/expo-acp-core/ios/native/acp_mobile_ffiFFI.xcframework
$ErrorActionPreference = "Stop"

if (-not $IsMacOS) {
  Write-Error "build-ios-native.ps1 must run on macOS because it uses xcodebuild to create an XCFramework."
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$crypto = Join-Path $root "ACP-crypto"
$ffi = Join-Path $crypto "acp-mobile-ffi"
$moduleIos = Join-Path (Join-Path (Join-Path (Join-Path $root "ancap-mobile") "modules") "expo-acp-core") "ios"
$generatedSwiftDir = Join-Path (Join-Path $moduleIos "generated") "swift"
$nativeDir = Join-Path $moduleIos "native"
$buildDir = Join-Path (Join-Path $ffi "target") "ios-uniffi"
$deviceTarget = "aarch64-apple-ios"
$simTargets = @("aarch64-apple-ios-sim", "x86_64-apple-ios")
$crateName = "acp_mobile_ffi"
$libName = "lib${crateName}.a"
$deviceOutDir = Join-Path $buildDir "iphoneos"
$simOutDir = Join-Path $buildDir "iphonesimulator"
$xcframeworkPath = Join-Path $nativeDir "acp_mobile_ffiFFI.xcframework"

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Error "Required command not found: $name"
  }
}

Require-Command rustup
Require-Command cargo
Require-Command xcodebuild
Require-Command lipo

New-Item -ItemType Directory -Force -Path $generatedSwiftDir | Out-Null
New-Item -ItemType Directory -Force -Path $nativeDir | Out-Null
New-Item -ItemType Directory -Force -Path $deviceOutDir | Out-Null
New-Item -ItemType Directory -Force -Path $simOutDir | Out-Null

Set-Location $crypto
rustup target add $deviceTarget | Out-Null
foreach ($target in $simTargets) {
  rustup target add $target | Out-Null
}

Write-Host "Building host release library for UniFFI generation..."
cargo build -p acp-mobile-ffi --release
$hostLib = Join-Path (Join-Path (Join-Path $crypto "target") "release") $libName
if (-not (Test-Path $hostLib)) {
  Write-Error "Missing host static library for UniFFI generation: $hostLib"
}

Write-Host "Generating Swift UniFFI bindings..."
$generatedFile = Join-Path $generatedSwiftDir "${crateName}.swift"
$generatedHeader = Join-Path $generatedSwiftDir "${crateName}FFI.h"
$generatedModuleMap = Join-Path $generatedSwiftDir "${crateName}FFI.modulemap"

cargo run -p acp-mobile-ffi --bin uniffi-bindgen -- generate `
  --library $hostLib `
  --language swift `
  --out-dir $generatedSwiftDir

if (-not (Test-Path $generatedFile) -or -not (Test-Path $generatedHeader) -or -not (Test-Path $generatedModuleMap)) {
  Write-Error "UniFFI generation did not produce the expected Swift artifacts in $generatedSwiftDir"
}

Write-Host "Building iPhoneOS static library..."
cargo build -p acp-mobile-ffi --release --target $deviceTarget
$deviceLib = Join-Path (Join-Path (Join-Path (Join-Path $crypto "target") $deviceTarget) "release") $libName
if (-not (Test-Path $deviceLib)) {
  Write-Error "Missing device static library: $deviceLib"
}
Copy-Item $deviceLib (Join-Path $deviceOutDir $libName) -Force

$simLibs = @()
foreach ($target in $simTargets) {
  Write-Host "Building iOS simulator static library for $target..."
  cargo build -p acp-mobile-ffi --release --target $target
  $builtLib = Join-Path (Join-Path (Join-Path (Join-Path $crypto "target") $target) "release") $libName
  if (-not (Test-Path $builtLib)) {
    Write-Error "Missing simulator static library: $builtLib"
  }
  $archOut = Join-Path $simOutDir "$target-$libName"
  Copy-Item $builtLib $archOut -Force
  $simLibs += $archOut
}

$simUniversalLib = Join-Path $simOutDir $libName
if ($simLibs.Count -eq 1) {
  Copy-Item $simLibs[0] $simUniversalLib -Force
} else {
  & lipo -create @simLibs -output $simUniversalLib
  if ($LASTEXITCODE -ne 0) {
    Write-Error "lipo failed while merging simulator static libraries"
  }
}

if (Test-Path $xcframeworkPath) {
  Remove-Item $xcframeworkPath -Recurse -Force
}

Write-Host "Creating XCFramework..."
& xcodebuild -create-xcframework `
  -library (Join-Path $deviceOutDir $libName) -headers $generatedSwiftDir `
  -library $simUniversalLib -headers $generatedSwiftDir `
  -output $xcframeworkPath

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $xcframeworkPath)) {
  Write-Error "xcodebuild failed to produce $xcframeworkPath"
}

Write-Host "iOS native ACP core staged successfully:"
Write-Host "- Swift bindings: $generatedSwiftDir"
Write-Host "- XCFramework: $xcframeworkPath"
Write-Host "Next: cd ancap-mobile/apps/acp-wallet-expo && npx expo run:ios"
