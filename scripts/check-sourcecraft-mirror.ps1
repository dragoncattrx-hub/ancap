# Compare GitHub origin/master vs SourceCraft master (mirror lag detector).
# Requires gitignored .env.sourcecraft with SOURCECRAFT_TOKEN=...
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env.sourcecraft"
if (-not (Test-Path $envFile)) { throw "Missing $envFile (SOURCECRAFT_TOKEN=...)" }

$token = (Select-String -Path $envFile -Pattern '^SOURCECRAFT_TOKEN=(.+)$').Matches[0].Groups[1].Value.Trim()
git fetch origin master 2>$null | Out-Null
$gh = (git rev-parse origin/master).Trim()
$scLine = git ls-remote "https://x-access-token:${token}@git.sourcecraft.dev/andrew-ptichka/ancap.git" refs/heads/master
$sc = ($scLine -split "\s+")[0]

Write-Host "GitHub      $gh"
Write-Host "SourceCraft $sc"
if ($gh -eq $sc) {
  Write-Host "OK: mirror matches GitHub master."
  exit 0
}
Write-Host "LAG: SourceCraft is behind. Direct push is blocked while Activate synchronization is ON."
Write-Host "Fix: SourceCraft UI → sync/re-import, OR turn sync OFF then: git push sourcecraft master"
exit 2
