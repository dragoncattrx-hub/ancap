# ANCAP Telegram & Moltbook Posting Script
# Posts crypto/ANCAP news every 3 hours

$ErrorActionPreference = "Stop"
. "C:\Users\drago\Desktop\ANCAP\scripts\moltbook-api.ps1"

# Load tokens from environment or local untracked files
$TELEGRAM_BOT_TOKEN = $env:TELEGRAM_BOT_TOKEN
$TELEGRAM_CHANNEL = if ($env:TELEGRAM_CHANNEL) { $env:TELEGRAM_CHANNEL } else { "@ancap24news" }
$MOLTBOOK_SUBMOLT = if ($env:MOLTBOOK_SUBMOLT) { $env:MOLTBOOK_SUBMOLT } else { "crypto" }
$MOLTBOOK_ENV_FILE = Join-Path (Get-Location) ".env.moltbook"
$MOLTBOOK_API_TOKEN = Get-MoltbookApiToken -Token $env:MOLTBOOK_API_TOKEN -EnvFilePath $MOLTBOOK_ENV_FILE

if (-not $TELEGRAM_BOT_TOKEN) { throw "TELEGRAM_BOT_TOKEN is not set" }

# Search for crypto/ANCAP news via SearXNG
Write-Host "Searching for crypto/ANCAP news..."
$searchUrl = "http://localhost:9080/search?q=cryptocurrency+ANCAP+AI&categories=news&format=json&time_range=day"
try {
    $searchResults = Invoke-RestMethod -Uri $searchUrl -Method GET -TimeoutSec 10
    $articles = $searchResults.results | Select-Object -First 5
    Write-Host "Found $($articles.Count) articles"
} catch {
    Write-Host "Error searching: $_"
    exit 1
}

if ($articles.Count -eq 0) {
    Write-Host "No articles found"
    exit 1
}

# Pick random article
$article = $articles | Get-Random

# Generate post content (English-only)
$stateFile = "C:\Users\drago\Desktop\ANCAP\memory\posting-state.json"
$lang = "en"

$post = @"
🛰️ Crypto & AI News

$($article.title)

$($article.content.Substring(0, [Math]::Min(200, $article.content.Length)))...

Source: $($article.url)

---
🚀 ANCAP Platform — AI-Native Capital Allocation
Autonomous AI economy: strategies, reputation, capital.
https://ancap.cloud/
"@

# Post to Telegram
Write-Host "Posting to Telegram..."
try {
    $telegramUrl = "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage"
    $telegramBody = @{
        chat_id = $TELEGRAM_CHANNEL
        text = $post
        parse_mode = "HTML"
    } | ConvertTo-Json
    
    $telegramResponse = Invoke-RestMethod -Uri $telegramUrl -Method POST -Body $telegramBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Telegram: Posted successfully"
} catch {
    Write-Host "❌ Telegram: Error - $_"
}

# Post to Moltbook
Write-Host "Posting to Moltbook..."
try {
    $moltbookResult = New-MoltbookVerifiedPost -Title $article.title -Content $post -Submolt $MOLTBOOK_SUBMOLT -Token $MOLTBOOK_API_TOKEN -EnvFilePath $MOLTBOOK_ENV_FILE -OutputPrefix "C:\Users\drago\Desktop\ANCAP\tmp\moltbook_post_latest"
    Write-Host "✅ Moltbook: Posted and verified successfully"
    Write-Host "Post URL: $($moltbookResult.Url)"
} catch {
    Write-Host "❌ Moltbook: Error - $_"
}

# Save state
@{
    lastRun = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    lastLang = $lang
    lastArticle = $article.title
} | ConvertTo-Json | Set-Content $stateFile -Encoding UTF8

Write-Host ""
Write-Host "Next posting: $(Get-Date (Get-Date).AddHours(3) -Format 'yyyy-MM-dd HH:mm:ss')"
