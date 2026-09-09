# Launch Cursor agent worker inside WSL Ubuntu.
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bashScript = Join-Path $scriptDir "start-cursor-worker-wsl.sh"

if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
    Write-Error "WSL is not installed. Install Ubuntu from 'wsl --install' or use scripts/fix-cursor-worker-sqlite.ps1"
}

Write-Host "Starting Cursor worker in WSL..."
Write-Host "Tip: clone repo inside WSL (~/ancap), not under C:\"
wsl.exe bash -lc "chmod +x '$($bashScript -replace '\\','/')' && '$($bashScript -replace '\\','/')'"
