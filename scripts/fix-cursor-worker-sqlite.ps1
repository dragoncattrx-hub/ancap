# Patch Cursor agent worker better-sqlite3 native module for current Node ABI (Windows workaround).
$ErrorActionPreference = "Stop"

$storageRoot = Join-Path $env:APPDATA "Cursor\User\globalStorage\anysphere.cursor-agent-worker\agent-cli\.local\share\cursor-agent\versions"
if (-not (Test-Path $storageRoot)) {
    Write-Error "Cursor agent CLI not found at $storageRoot. Open Cursor Agents once, then retry."
}

$versions = Get-ChildItem $storageRoot -Directory | Sort-Object Name -Descending
if ($versions.Count -eq 0) {
    Write-Error "No agent CLI versions under $storageRoot"
}

$agentDir = $versions[0].FullName
$nodeExe = Join-Path $agentDir "node.exe"
$dest = Join-Path $agentDir "node_modules\better-sqlite3\build\Release\better_sqlite3.node"

if (-not (Test-Path $nodeExe)) {
    Write-Error "node.exe missing in $agentDir"
}

$abi = & $nodeExe -p "process.versions.modules"
Write-Host "Agent Node ABI: $abi (dir: $($versions[0].Name))"

if (-not (Test-Path $dest)) {
    Write-Error "better_sqlite3.node not found at $dest"
}

$tmp = Join-Path $env:TEMP "better-sqlite3-prebuild-$abi"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
Push-Location $tmp
try {
    if (-not (Test-Path "package\build\Release\better_sqlite3.node")) {
        Write-Host "Downloading prebuild for ABI $abi..."
        npm pack "better-sqlite3@11.7.0" --silent 2>$null
        $tgz = Get-ChildItem "better-sqlite3-*.tgz" | Select-Object -First 1
        tar -xf $tgz.Name
    }
    $src = Join-Path $tmp "package\build\Release\better_sqlite3.node"
    if (-not (Test-Path $src)) {
        Write-Error "Prebuild download failed. Use WSL worker instead: scripts/start-cursor-worker-wsl.ps1"
    }
    Copy-Item $dest "$dest.bak-$abi" -Force
    Copy-Item $src $dest -Force
    Write-Host "Patched $dest"
    & $nodeExe -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); console.log('sqlite OK', db.prepare('select 1 as x').get());"
    Write-Host "Done. Fully restart Cursor and run /remote-control in Agents Window."
}
finally {
    Pop-Location
}
