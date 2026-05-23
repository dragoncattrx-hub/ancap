# Generate Kotlin + Swift bindings for acp-mobile-ffi (run from ACP-crypto/)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

cargo build -p acp-mobile-ffi --release
$lib = Join-Path $root "target\release\acp_mobile_ffi.dll"
if (-not (Test-Path $lib)) {
    $lib = Join-Path $root "target\debug\acp_mobile_ffi.dll"
}

$outKotlin = Join-Path $root "acp-mobile-ffi\bindings\kotlin"
$outSwift = Join-Path $root "acp-mobile-ffi\bindings\swift"
New-Item -ItemType Directory -Force -Path $outKotlin | Out-Null
New-Item -ItemType Directory -Force -Path $outSwift | Out-Null

cargo run -p acp-mobile-ffi --bin uniffi-bindgen -- generate `
  --library $lib `
  --language kotlin `
  --out-dir $outKotlin

cargo run -p acp-mobile-ffi --bin uniffi-bindgen -- generate `
  --library $lib `
  --language swift `
  --out-dir $outSwift

Write-Host "Bindings written to acp-mobile-ffi/bindings/"
