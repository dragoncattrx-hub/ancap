# Broadcast ANCAP promo across owned channels (Telegram, Moltbook, X).
$ErrorActionPreference = "Continue"
Set-Location "C:\Users\drago\Desktop\ANCAP"
. ".\scripts\moltbook-api.ps1"

foreach ($file in @(".env.telegram", ".env.moltbook", ".env.x")) {
  if (-not (Test-Path $file)) { continue }
  Get-Content $file | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) {
      Set-Item -Path ("Env:" + $parts[0].Trim()) -Value ($parts[1].Trim().Trim('"').Trim("'"))
    }
  }
}

$title = "ANCAP - AI-Native Capital Allocation"
$tgPost = @"
ANCAP - AI-Native Capital Allocation Platform

Buy paid AI workflows for crypto teams: listing packs, risk reports, campaign builders, bounty flows - settled in ACP.

What is live now:
- Workflow marketplace + proof receipts
- ACP wallet / bridge (wACP) / sACP stablecoin desk
- Digital Passport + encrypted education docs
- Lunar land desk / AETERNA longevity rails

Start free: https://ancap.cloud/token-snapshot
Product: https://ancap.cloud/
Passport: https://ancap.cloud/passport
Workflows: https://ancap.cloud/ai/workflows
Telegram: https://t.me/ancap24news

#ANCAP #ACP #AI #Web3 #Crypto
"@

$mbContent = @"
ANCAP - AI-Native Capital Allocation

Paid AI execution for crypto teams and agents. ACP-settled workflows with proof receipts.

Live:
- Marketplace + developers API
- ACP wallet, wACP bridge, sACP
- Digital Passport (ChaCha20-Poly1305 education vault)
- Lunar desk + AETERNA rails

Free entry: https://ancap.cloud/token-snapshot
Home: https://ancap.cloud/
Passport: https://ancap.cloud/passport

Build with ANCAP.
"@

$xText = @"
ANCAP - AI-native capital allocation.

Paid AI workflows for crypto teams (ACP). Wallet, bridge, Digital Passport, proof receipts.

Free start: https://ancap.cloud/token-snapshot
https://ancap.cloud/

#ANCAP #ACP #AI #Web3
"@

Set-Content -Path ".\telegram-post-content.txt" -Value $tgPost -Encoding UTF8
New-Item -ItemType Directory -Path ".\tmp" -Force | Out-Null
$results = [ordered]@{}

Write-Host "=== TELEGRAM ==="
try {
  if (-not $env:TELEGRAM_BOT_TOKEN) { throw "TELEGRAM_BOT_TOKEN missing" }
  $channel = if ($env:TELEGRAM_CHANNEL) { $env:TELEGRAM_CHANNEL } else { "@ancap24news" }
  $url = "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/sendMessage"
  $payload = @{ chat_id = $channel; text = $tgPost; disable_web_page_preview = $false } | ConvertTo-Json -Depth 5
  $tg = Invoke-RestMethod -Uri $url -Method POST -Body ([System.Text.Encoding]::UTF8.GetBytes($payload)) -ContentType "application/json; charset=utf-8" -TimeoutSec 30
  $results.telegram = "OK message_id=$($tg.result.message_id) https://t.me/ancap24news"
  Write-Host $results.telegram
} catch {
  $results.telegram = "FAIL $($_.Exception.Message)"
  Write-Host $results.telegram
}

Write-Host "=== MOLTBOOK ==="
try {
  $sub = if ($env:MOLTBOOK_SUBMOLT) { $env:MOLTBOOK_SUBMOLT } else { "crypto" }
  $mb = New-MoltbookVerifiedPost -Title $title -Content $mbContent -Submolt $sub -EnvFilePath ".\.env.moltbook" -OutputPrefix ".\tmp\moltbook_ancap_promo"
  $pub = "https://www.moltbook.com/post/$($mb.Post.id)"
  $results.moltbook = "OK $pub status=$($mb.Post.verification_status)"
  Write-Host $results.moltbook
} catch {
  $results.moltbook = "FAIL $($_.Exception.Message)"
  Write-Host $results.moltbook
}

Write-Host "=== X ==="
try {
  Set-Content -Path ".\tmp\x_promo_text.txt" -Value $xText -Encoding UTF8
  @'
from pathlib import Path
import json
from requests_oauthlib import OAuth1Session
env={}
for line in Path(r"C:\Users\drago\Desktop\ANCAP\.env.x").read_text(encoding="utf-8").splitlines():
    line=line.strip()
    if not line or line.startswith("#") or "=" not in line: continue
    k,v=line.split("=",1); env[k.strip()]=v.strip()
s=OAuth1Session(env["X_API_KEY"], client_secret=env["X_API_SECRET"], resource_owner_key=env["X_ACCESS_TOKEN"], resource_owner_secret=env["X_ACCESS_TOKEN_SECRET"])
text=Path(r"C:\Users\drago\Desktop\ANCAP\tmp\x_promo_text.txt").read_text(encoding="utf-8")
r=s.post("https://api.twitter.com/2/tweets", json={"text": text})
body=r.json() if r.content else {}
Path(r"C:\Users\drago\Desktop\ANCAP\tmp\x_ancap_promo.json").write_text(json.dumps({"status":r.status_code,"body":body},indent=2),encoding="utf-8")
if r.status_code in (200,201):
    tid=(body.get("data") or {}).get("id")
    print("OK https://x.com/mr3n3rgy777/status/%s" % tid)
else:
    print("FAIL %s %s" % (r.status_code, json.dumps(body)[:300]))
'@ | Set-Content -Path ".\tmp\x_promo_runner.py" -Encoding UTF8
  $xOut = python ".\tmp\x_promo_runner.py" 2>&1 | Out-String
  $results.x = $xOut.Trim()
  Write-Host $results.x
} catch {
  $results.x = "FAIL $($_.Exception.Message)"
  Write-Host $results.x
}

$results | ConvertTo-Json | Set-Content ".\tmp\ancap_promo_broadcast.json" -Encoding UTF8
Write-Host "=== DONE ==="
$results.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key): $($_.Value)" }
