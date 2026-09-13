# Theodore ACP earning loop: post one live paid SKU to @ancap24news per run.
# Russian copy lives in theodore-earn-skus.json (UTF-8) so Windows PowerShell 5.1
# does not mojibake Cyrillic when parsing this .ps1 without a BOM.
$ErrorActionPreference = "Stop"
Set-Location "C:\Users\drago\Desktop\ANCAP"

foreach ($file in @(".env.telegram")) {
  if (-not (Test-Path $file)) { continue }
  Get-Content $file -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) {
      Set-Item -Path ("Env:" + $parts[0].Trim()) -Value ($parts[1].Trim().Trim('"').Trim("'"))
    }
  }
}

if (-not $env:TELEGRAM_BOT_TOKEN) { throw "TELEGRAM_BOT_TOKEN missing" }
$channel = if ($env:TELEGRAM_CHANNEL) { $env:TELEGRAM_CHANNEL } else { "@ancap24news" }

$skusPath = Join-Path $PSScriptRoot "theodore-earn-skus.json"
if (-not (Test-Path $skusPath)) { throw "Missing $skusPath" }
$allSkus = @(Get-Content $skusPath -Raw -Encoding UTF8 | ConvertFrom-Json)
# Site-only conceptual SKUs stay on ancap.cloud news — do not spam Telegram / Moltbook.
$skus = @($allSkus | Where-Object {
  if ($null -eq $_.channels) { return $true }
  @($_.channels) -contains "telegram"
})
if (-not $skus -or $skus.Count -lt 1) { throw "No telegram-eligible SKUs in $skusPath" }

$statePath = "C:\Users\drago\Desktop\ANCAP\memory\theodore-earn-state.json"
New-Item -ItemType Directory -Path (Split-Path $statePath) -Force | Out-Null
$index = 0
if (Test-Path $statePath) {
  try {
    $state = Get-Content $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $index = [int]$state.nextIndex
  } catch {
    $index = 0
  }
}
$index = $index % $skus.Count
$sku = $skus[$index]

# Build JSON with explicit Unicode escapes so PS 5.1 ConvertTo-Json cannot corrupt text.
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
  lastSku = $sku.id
  lastMessageId = $tg.result.message_id
  nextIndex = $next
} | ConvertTo-Json | Set-Content $statePath -Encoding UTF8

Write-Host "OK sku=$($sku.id) message_id=$($tg.result.message_id) https://t.me/ancap24news"
