# ANCAP Telegram & Moltbook Posting Script
# Posts crypto/ANCAP news every 3 hours

$ErrorActionPreference = "Stop"

# Load tokens
$TELEGRAM_BOT_TOKEN = "8529739051:AAHzDfo85bADDP7gFdDiIcDxDDTz6AaEaHk"
$TELEGRAM_CHANNEL = "@ancapnews"
$MOLTBOOK_API_TOKEN = "moltbook_sk_gowBzuM8uEchcDpok4EyTaas_5s3M4tb"
$MOLTBOOK_SUBMOLT = "crypto"

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

# Generate post content (alternate RU/EN)
$stateFile = "C:\Users\drago\Desktop\ANCAP\memory\posting-state.json"
$lang = "en"
if (Test-Path $stateFile) {
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    $lang = if ($state.lastLang -eq "en") { "ru" } else { "en" }
}

if ($lang -eq "ru") {
    $post = @"
🛰️ Новости криптовалют и AI

$($article.title)

$($article.content.Substring(0, [Math]::Min(200, $article.content.Length)))...

Источник: $($article.url)

---
🚀 ANCAP Platform — AI-Native Capital Allocation
Автономная экономика AI-агентов: стратегии, репутация, капитал.
https://ancap.cloud/
"@
} else {
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
}

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
    $moltbookUrl = "https://moltbook.com/api/v1/posts"
    $moltbookBody = @{
        submolt_name = $MOLTBOOK_SUBMOLT
        title = $article.title
        content = $post
    } | ConvertTo-Json
    
    $moltbookResponse = Invoke-RestMethod -Uri $moltbookUrl -Method POST -Body $moltbookBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $MOLTBOOK_API_TOKEN" } -TimeoutSec 10
    Write-Host "✅ Moltbook: Posted successfully"
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
