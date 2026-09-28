# Theodore ACP earning loop: post one live paid SKU to Telegram per run.
# Visible / portable operator script — NOT a hidden persistence agent.
# Russian copy lives in theodore-earn-skus.json (UTF-8) so Windows PowerShell 5.1
# does not mojibake Cyrillic when parsing this .ps1 without a BOM.
#
# Security policy:
# - Telegram Bot API only (allowlisted channel).
# - No private keys, bridge signer, hot wallet, or on-chain spend.
# - Any money movement requires a separate human-confirmed operator path.
# - Run via an interactive / visible Scheduled Task (do NOT use -WindowStyle Hidden).

$ErrorActionPreference = "Stop"

$RepoRoot = if ($env:ANCAP_REPO_ROOT) {
  $env:ANCAP_REPO_ROOT
} elseif ($PSScriptRoot) {
  Split-Path -Parent $PSScriptRoot
} else {
  (Get-Location).Path
}
Set-Location $RepoRoot

$LogDir = Join-Path $RepoRoot "memory"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
$LogPath = Join-Path $LogDir "theodore-earn.log"
function Write-TheoLog([string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date).ToString("o"), $Message
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $line
}

Write-TheoLog "Theodore promo start (visible operator run) repo=$RepoRoot"

foreach ($file in @(".env.telegram", ".env")) {
  $path = Join-Path $RepoRoot $file
  if (-not (Test-Path $path)) { continue }
  Get-Content $path -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) {
      Set-Item -Path ("Env:" + $parts[0].Trim()) -Value $parts[1].Trim().Trim('"').Trim("'")
    }
  }
}

if (-not $env:TELEGRAM_BOT_TOKEN) { throw "TELEGRAM_BOT_TOKEN missing" }
$channel = if ($env:TELEGRAM_CHANNEL) { $env:TELEGRAM_CHANNEL } else { "@ancap24news" }

# Hard deny: refuse to load wallet / signer material even if present in the environment.
foreach ($forbidden in @(
  "ACP_HOT_MNEMONIC",
  "ACP_HOT_MNEMONIC_FILE",
  "BRIDGE_SIGNER_KEY",
  "PRIVATE_KEY",
  "MNEMONIC"
)) {
  if (Get-Item -Path ("Env:" + $forbidden) -ErrorAction SilentlyContinue) {
    throw "Refusing to run Theodore while $forbidden is set — promo agent must not hold spend keys."
  }
}

$skusPath = Join-Path $PSScriptRoot "theodore-earn-skus.json"
if (-not (Test-Path $skusPath)) { throw "Missing $skusPath" }
$allSkus = @(Get-Content $skusPath -Raw -Encoding UTF8 | ConvertFrom-Json)
# Site-only conceptual SKUs stay on ancap.cloud news — do not spam Telegram / Moltbook.
$skus = @($allSkus | Where-Object {
  if ($null -eq $_.channels) { return $true }
  @($_.channels) -contains "telegram"
})
if (-not $skus -or $skus.Count -lt 1) { throw "No telegram-eligible SKUs in $skusPath" }

$statePath = Join-Path $LogDir "theodore-earn-state.json"
$index = 0
if (Test-Path $statePath) {
  try {
    $state = Get-Content $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $index = [int]$state.nextIndex
    if ($null -ne $state.lastSku -and $state.lastSku -is [System.Array]) {
      $state.lastSku = [string]$state.lastSku[0]
    }
  } catch {
    $index = 0
  }
}
$index = $index % $skus.Count
$sku = $skus[$index]

function ConvertTo-TelegramJsonPayload {
  param(
    [string]$ChatId,
    [string]$Text
  )
  $esc = [System.Web.HttpUtility]::JavaScriptStringEncode($Text)
  return "{`"chat_id`":`"$ChatId`",`"text`":`"$esc`",`"disable_web_page_preview`":false}"
}

Add-Type -AssemblyName System.Web
$payload = ConvertTo-TelegramJsonPayload -ChatId $channel -Text $sku.text.Trim()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$url = "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/sendMessage"
$tg = Invoke-RestMethod -Uri $url -Method POST -Body $bytes -ContentType "application/json; charset=utf-8" -TimeoutSec 30

$next = ($index + 1) % $skus.Count
@{
  lastRun = (Get-Date).ToString("o")
  lastSku = [string]$sku.id
  lastMessageId = $tg.result.message_id
  nextIndex = $next
  moneyOps = "disabled_human_confirm_required"
} | ConvertTo-Json | Set-Content $statePath -Encoding UTF8

Write-TheoLog ("OK sku={0} message_id={1} channel={2}" -f $sku.id, $tg.result.message_id, $channel)
Write-Host "OK sku=$($sku.id) message_id=$($tg.result.message_id) channel=$channel"
