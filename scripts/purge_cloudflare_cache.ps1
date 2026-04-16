#Requires -Version 5.1
<#
  Purge Cloudflare edge cache (needed once after /_next/static/* was cached as HTML).

  1. Cloudflare Dashboard -> your domain -> Overview -> Zone ID (right column)
  2. My Profile -> API Tokens -> Create with permission "Zone.Cache Purge" -> Edit zone

  Then in PowerShell:
    $env:CF_ZONE_ID = "paste-zone-id"
    $env:CF_API_TOKEN = "paste-token"
    .\scripts\purge_cloudflare_cache.ps1
#>
param(
    [string]$ZoneId = $env:CF_ZONE_ID,
    [string]$Token = $env:CF_API_TOKEN
)

if (-not $ZoneId -or -not $Token) {
    Write-Error "Set CF_ZONE_ID and CF_API_TOKEN environment variables, then run again."
    exit 1
}

$uri = "https://api.cloudflare.com/client/v4/zones/$ZoneId/purge_cache"
$body = '{"purge_everything":true}'

try {
    $r = Invoke-RestMethod -Uri $uri -Method Post `
        -Headers @{
            Authorization = "Bearer $Token"
            "Content-Type"  = "application/json"
        } `
        -Body $body
    if ($r.success) {
        Write-Host "OK: Cloudflare cache purged."
        exit 0
    }
    Write-Error ($r.errors | ConvertTo-Json -Compress)
    exit 1
} catch {
    Write-Error $_
    exit 1
}
