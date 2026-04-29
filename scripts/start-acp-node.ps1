#!/usr/bin/env pwsh
# Start the ACP node for the local ANCAP development stack.
#
# Usage:
#   .\scripts\start-acp-node.ps1            # starts in the foreground, logs to stdout
#   .\scripts\start-acp-node.ps1 -Background # starts in the background, logs to Sicret\acp-node.log
#
# The node is required by:
#   - frontend-app /wallet/acp page (deposit address, balance, history)
#   - app/api/routers/wallet_acp.py (calls walletd against $ACP_RPC_URL)
#   - app/services/chain_anchor.py when CHAIN_ANCHOR_DRIVER=acp
#
# It listens on 0.0.0.0:8545 so the API container can reach it via
# host.docker.internal:8545 (default of ACP_RPC_URL in .env).

[CmdletBinding()]
param(
    [switch]$Background,
    [string]$DataDir = (Join-Path $PSScriptRoot "..\Sicret\acp-node-data-host"),
    [string]$RpcListen = "0.0.0.0:8545",
    [int]$ChainId = 1001,
    [switch]$EnableMiner
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$nodeBin = Join-Path $repoRoot "ACP-crypto\acp-node\target\release\acp-node.exe"
$logFile = Join-Path $repoRoot "Sicret\acp-node.log"

if (-not (Test-Path $nodeBin)) {
    Write-Host "Building acp-node (release)..." -ForegroundColor Cyan
    Push-Location (Join-Path $repoRoot "ACP-crypto\acp-node")
    try {
        cargo build --release
    }
    finally {
        Pop-Location
    }
}
if (-not (Test-Path $nodeBin)) {
    throw "acp-node binary not found after build at $nodeBin"
}

if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
}

$env:ACP_DATA_DIR = (Resolve-Path $DataDir).Path
$env:ACP_RPC_LISTEN = $RpcListen
$env:ACP_CHAIN_ID = "$ChainId"
$env:ACP_MINER_ENABLED = if ($EnableMiner) { "true" } else { "false" }

Write-Host "ACP node:" -ForegroundColor Cyan
Write-Host "  binary    : $nodeBin"
Write-Host "  data_dir  : $env:ACP_DATA_DIR"
Write-Host "  rpc       : $env:ACP_RPC_LISTEN"
Write-Host "  chain_id  : $env:ACP_CHAIN_ID"
Write-Host "  miner     : $env:ACP_MINER_ENABLED"

if ($Background) {
    Write-Host "Starting in background, logs -> $logFile" -ForegroundColor Cyan
    Start-Process -FilePath $nodeBin -RedirectStandardOutput $logFile -RedirectStandardError $logFile -NoNewWindow -PassThru | Out-Null
    Start-Sleep -Seconds 2
    if (Test-Path $logFile) { Get-Content -Path $logFile -Tail 10 }
}
else {
    Write-Host "Starting in foreground (Ctrl+C to stop)..." -ForegroundColor Cyan
    & $nodeBin
}
