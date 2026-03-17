param(
  [string]$ApiBase = "http://127.0.0.1:8001"
)

$ErrorActionPreference = "Stop"

function Invoke-Anchor {
  param(
    [string]$Driver,
    [string]$RpcUrl
  )

  $env:CHAIN_ANCHOR_DRIVER = $Driver
  $env:ACP_RPC_URL = ""
  $env:ETHEREUM_RPC_URL = ""
  $env:SOLANA_RPC_URL = ""

  if ($Driver -eq "acp") { $env:ACP_RPC_URL = $RpcUrl }
  if ($Driver -eq "ethereum") { $env:ETHEREUM_RPC_URL = $RpcUrl }
  if ($Driver -eq "solana") { $env:SOLANA_RPC_URL = $RpcUrl }

  $body = @{
    chain_id      = $Driver
    payload_type  = "smoke"
    payload_hash  = ("ab" * 32)
    payload_json  = @{ ts = (Get-Date).ToString("o") }
  } | ConvertTo-Json -Depth 5

  Write-Host "Anchoring via $Driver ..."
  $resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/v1/chain/anchor" -ContentType "application/json" -Body $body
  if (-not $resp.tx_hash) { throw "Missing tx_hash for driver=$Driver" }
  Write-Host "OK: $($resp.tx_hash)"
}

Write-Host "== ANCAP chain anchor smoke =="
Write-Host "API base: $ApiBase"

Write-Host "Health ..."
Invoke-RestMethod -Method Get -Uri "$ApiBase/v1/system/health" | Out-Null
Write-Host "OK"

Invoke-Anchor -Driver "mock" -RpcUrl ""

if ($env:ACP_RPC_URL) { Invoke-Anchor -Driver "acp" -RpcUrl $env:ACP_RPC_URL } else { Write-Host "Skip acp: ACP_RPC_URL not set" }
if ($env:ETHEREUM_RPC_URL) { Invoke-Anchor -Driver "ethereum" -RpcUrl $env:ETHEREUM_RPC_URL } else { Write-Host "Skip ethereum: ETHEREUM_RPC_URL not set" }
if ($env:SOLANA_RPC_URL) { Invoke-Anchor -Driver "solana" -RpcUrl $env:SOLANA_RPC_URL } else { Write-Host "Skip solana: SOLANA_RPC_URL not set" }

Write-Host "Done."

