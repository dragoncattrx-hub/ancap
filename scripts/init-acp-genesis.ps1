#!/usr/bin/env pwsh
# Initialize a fresh ACP chain with a custom genesis block:
#   * 1,000,000 ACP -> the project hot wallet
#     (acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9 by default)
#   * 209,000,000 ACP -> a freshly-generated treasury wallet whose mnemonic is
#     written to Sicret\genesis-treasury-mnemonic.txt
#
# Pre-requisites:
#   * acp-node already running and listening on $RpcUrl with an empty data dir
#     (use scripts\start-acp-node.ps1 first; clear Sicret\acp-node-data-host\
#     when re-bootstrapping).
#
# Usage:
#   .\scripts\init-acp-genesis.ps1
#   .\scripts\init-acp-genesis.ps1 -TargetAddress acp1... -TargetAmountAcp 5000000

[CmdletBinding()]
param(
    [string]$TargetAddress = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9",
    [int]$TargetAmountAcp = 1000000,
    [string]$RpcUrl = "http://127.0.0.1:8545/rpc",
    [string]$RpcToken = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$exe = Join-Path $repoRoot "ACP-crypto\acp-wallet\target\release\examples\build_and_submit_genesis_custom.exe"

if (-not (Test-Path $exe)) {
    Write-Host "Building build_and_submit_genesis_custom example..." -ForegroundColor Cyan
    Push-Location (Join-Path $repoRoot "ACP-crypto\acp-wallet")
    try {
        cargo build --release --example build_and_submit_genesis_custom
    }
    finally {
        Pop-Location
    }
}
if (-not (Test-Path $exe)) {
    throw "Custom genesis example binary not found at $exe"
}

$env:ACP_RPC_URL = $RpcUrl
$env:ACP_GENESIS_TARGET_ADDRESS = $TargetAddress
$env:ACP_GENESIS_TARGET_AMOUNT_ACP = "$TargetAmountAcp"
$env:ACP_GENESIS_TREASURY_OUT_PATH = "Sicret/genesis-treasury-mnemonic.txt"
if (-not [string]::IsNullOrWhiteSpace($RpcToken)) {
    $env:ACP_RPC_TOKEN = $RpcToken
}

Push-Location $repoRoot
try {
    & $exe
}
finally {
    Pop-Location
}
