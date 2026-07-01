# Prepare ANCAP ACP Wallet for Android Studio (Windows).
# Run from repo root or ancap-mobile:
#   .\ancap-mobile\scripts\prepare-android-studio.ps1
#   .\ancap-mobile\scripts\prepare-android-studio.ps1 -BuildNative
#   .\ancap-mobile\scripts\prepare-android-studio.ps1 -Architecture arm64-v8a

param(
    [switch] $BuildNative,
    [switch] $SkipGradleCheck,
    [string] $Architecture = "x86_64"
)

$ErrorActionPreference = "Stop"

$mobileRoot = Split-Path $PSScriptRoot -Parent
$appRoot = Join-Path $mobileRoot "apps\acp-wallet-expo"
$androidRoot = Join-Path $appRoot "android"
$localProps = Join-Path $androidRoot "local.properties"
$gradleProps = Join-Path $androidRoot "gradle.properties"

function Ensure-AndroidCmdlineTools {
    param([string] $SdkPath)

    $sdkmanager = Join-Path $SdkPath "cmdline-tools\latest\bin\sdkmanager.bat"
    if (Test-Path $sdkmanager) {
        Write-Host "Android SDK cmdline-tools OK: $sdkmanager"
        return
    }

    Write-Host "Installing Android SDK command-line tools (fixes SDK XML v4 warning) ..."
    $zipUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $zip = Join-Path $env:TEMP "ancap-android-cmdline-tools.zip"
    $extract = Join-Path $env:TEMP "ancap-android-cmdline-tools-extract"
    $destLatest = Join-Path $SdkPath "cmdline-tools\latest"

    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $zip -UseBasicParsing
        if (Test-Path $extract) { Remove-Item -Recurse -Force $extract }
        New-Item -ItemType Directory -Path $extract -Force | Out-Null
        Expand-Archive -Path $zip -DestinationPath $extract -Force
        New-Item -ItemType Directory -Path (Split-Path $destLatest -Parent) -Force | Out-Null
        if (Test-Path $destLatest) { Remove-Item -Recurse -Force $destLatest }
        $inner = Join-Path $extract "cmdline-tools"
        if (-not (Test-Path $inner)) { $inner = $extract }
        Move-Item -Path $inner -Destination $destLatest
        Write-Host "Installed cmdline-tools to $destLatest"
    } finally {
        Remove-Item $zip -Force -ErrorAction SilentlyContinue
        Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Resolve-AndroidSdkPath {
    $candidates = @(
        $env:ANDROID_HOME,
        $env:ANDROID_SDK_ROOT,
        (Join-Path $env:LOCALAPPDATA "Android\Sdk"),
        (Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk")
    ) | Where-Object { $_ }

    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return (Resolve-Path $path).Path
        }
    }
    return $null
}

function Resolve-NodeDir {
    if ($env:NODE_BINARY -and (Test-Path $env:NODE_BINARY)) {
        return (Split-Path -Parent (Resolve-Path $env:NODE_BINARY).Path)
    }

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd -and $nodeCmd.Source) {
        return (Split-Path -Parent $nodeCmd.Source)
    }

    $candidates = @(
        (Join-Path ${env:ProgramFiles} "nodejs"),
        (Join-Path $env:LOCALAPPDATA "Programs\node")
    ) | Where-Object { $_ -and (Test-Path (Join-Path $_ "node.exe")) }

    if ($candidates.Count -gt 0) {
        return (Resolve-Path $candidates[0]).Path
    }

    return $null
}

function Escape-LocalPropertiesPath([string] $Path) {
    return ($Path -replace '\\', '\\')
}

function Set-GradleUserHomeJvmArg {
    param([string] $AndroidDir)

    $localHome = "C:\gradle-ancap"
    if (-not (Test-Path $localHome)) {
        New-Item -ItemType Directory -Path $localHome -Force | Out-Null
    }
    $homeForJvm = (Resolve-Path $localHome).Path -replace '\\', '/'
    $propsFile = Join-Path $AndroidDir "gradle.properties"
    $content = Get-Content $propsFile -Raw
    $jvmLine = "org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Dgradle.user.home=$homeForJvm"
    if ($content -match '(?m)^org\.gradle\.jvmargs=.*$') {
        $content = $content -replace '(?m)^org\.gradle\.jvmargs=.*$', $jvmLine
    } else {
        $content = $jvmLine + "`n" + $content
    }
    Set-Content -Path $propsFile -Value $content -Encoding ascii
    Write-Host "Set -Dgradle.user.home in gradle.properties"
}

function Set-GradleArchitecture([string] $Arch) {
    if (-not (Test-Path $gradleProps)) {
        Write-Error "Missing $gradleProps"
    }
    $content = Get-Content $gradleProps -Raw
    $line = "reactNativeArchitectures=$Arch"
    if ($content -match '(?m)^reactNativeArchitectures=.*$') {
        $content = $content -replace '(?m)^reactNativeArchitectures=.*$', $line
    } else {
        $content += "`n$line`n"
    }
    Set-Content -Path $gradleProps -Value $content -Encoding ascii
    Write-Host "Set reactNativeArchitectures=$Arch in gradle.properties"
}

function Sync-ReactNativeVersionCatalog {
    param([string] $AndroidDir, [string] $MonorepoRoot)

    # Kept for optional manual reference; Gradle no longer loads this via versionCatalogs
    # (Gradle 8.10 on Windows fails dependencies-accessors metadata.bin generation).
    $source = Join-Path $MonorepoRoot "node_modules\react-native\gradle\libs.versions.toml"
    $destDir = Join-Path $AndroidDir "gradle"
    $dest = Join-Path $destDir "libs.versions.toml"
    if (-not (Test-Path $source)) {
        return
    }
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item -Path $source -Destination $dest -Force
  $content = Get-Content $dest -Raw
  $content = $content -replace 'agp = "8\.6\.0"', 'agp = "8.8.2"'
  Set-Content -Path $dest -Value $content -Encoding ascii
}

function Assert-AndroidStudioClosed {
    $studio = Get-Process -Name "studio64" -ErrorAction SilentlyContinue
    if ($studio) {
        Write-Error @"
Android Studio is still running (PID $($studio.Id)).
Close Android Studio completely (File -> Exit), then re-run:
  .\ancap-mobile\scripts\prepare-android-studio.ps1 -SkipGradleCheck
"@
    }
}

function Ensure-AndroidStudioIdeConfig {
    param([string] $AndroidDir)

    $gradleXml = Join-Path $AndroidDir ".idea\gradle.xml"
    $ideaDir = Split-Path $gradleXml -Parent
    if (-not (Test-Path $ideaDir)) {
        New-Item -ItemType Directory -Path $ideaDir -Force | Out-Null
    }

    $homeValue = 'C:/gradle-ancap'
    if (-not (Test-Path $gradleXml)) {
        @"
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="GradleSettings">
    <option name="linkedExternalProjectsSettings">
      <GradleProjectSettings>
        <option name="externalProjectPath" value="`$PROJECT_DIR`$" />
        <option name="gradleUserHome" value="$homeValue" />
        <option name="resolveModulePerSourceSet" value="false" />
      </GradleProjectSettings>
    </option>
  </component>
</project>
"@ | Set-Content -Path $gradleXml -Encoding UTF8
        Write-Host "Created $gradleXml (project-local Gradle cache)"
        return
    }

    [xml]$xml = Get-Content $gradleXml
    $settings = $xml.project.GradleSettings.linkedExternalProjectsSettings.GradleProjectSettings
    if (-not $settings) {
        Write-Warning "Could not patch gradle.xml automatically."
        return
    }

    $homeValue = 'C:/gradle-ancap'
    $existing = @($settings.option | Where-Object { $_.name -eq 'gradleUserHome' })
    if ($existing.Count -gt 0) {
        $existing[0].value = $homeValue
    } else {
        $opt = $xml.CreateElement('option')
        $opt.SetAttribute('name', 'gradleUserHome')
        $opt.SetAttribute('value', $homeValue)
        [void]$settings.InsertBefore($opt, $settings.option[0])
    }
    $xml.Save($gradleXml)
    Write-Host "Set gradleUserHome in $gradleXml"
}

function Bootstrap-LocalGradleHome {
    param([string] $AndroidDir)

    $localHome = "C:\gradle-ancap"
    if (-not (Test-Path $localHome)) {
        New-Item -ItemType Directory -Path $localHome -Force | Out-Null
    }

    $globalDists = Join-Path $env:USERPROFILE ".gradle\wrapper\dists"
    $localDists = Join-Path $localHome "wrapper\dists"
    if ((Test-Path $globalDists) -and -not (Test-Path $localDists)) {
        Write-Host "Bootstrapping Gradle wrapper into project-local cache ..."
        New-Item -ItemType Directory -Path (Split-Path $localDists -Parent) -Force | Out-Null
        Copy-Item -Path $globalDists -Destination $localDists -Recurse -Force
    }
}

function Repair-GradleCache {
    param([string] $AndroidDir)

    $localHome = "C:\gradle-ancap"
    $targets = @(
        (Join-Path $AndroidDir "build"),
        (Join-Path $AndroidDir "app\build"),
        (Join-Path $AndroidDir ".gradle"),
        (Join-Path $localHome "caches\8.10.2\transforms"),
        (Join-Path $localHome "caches\8.10.2\dependencies-accessors"),
        (Join-Path $localHome "caches\8.10.2\kotlin-dsl"),
        (Join-Path $localHome "caches\8.10.2\groovy-dsl"),
        (Join-Path $localHome "daemon")
    )

    foreach ($target in $targets) {
        if (-not (Test-Path $target)) {
            continue
        }
        Write-Host "Removing project Gradle/build cache: $target"
        Remove-Item -Recurse -Force $target -ErrorAction SilentlyContinue
    }
}

function Stop-AllGradleDaemons {
    Write-Host "Stopping Gradle daemons (close Android Studio first) ..."
    Push-Location $androidRoot
    try {
        $job = Start-Job { param($dir) Set-Location $dir; & .\gradlew.bat --stop 2>&1 | Out-Null } -ArgumentList $androidRoot
        if (Wait-Job $job -Timeout 15) {
            Receive-Job $job | Out-Null
        } else {
            Write-Host "gradlew --stop timed out; continuing cache repair ..."
            Stop-Job $job -Force -ErrorAction SilentlyContinue
        }
        Remove-Job $job -Force -ErrorAction SilentlyContinue
    } catch {
        # Ignore when gradlew cannot run yet.
    } finally {
        Pop-Location
    }
    Start-Sleep -Seconds 1
}

function Repair-GlobalGradleCaches {
    Write-Host "Repairing global Gradle caches (fixes metadata.bin / transforms sync errors) ..."
    Stop-AllGradleDaemons

    $globalWrapper = Join-Path $env:USERPROFILE ".gradle\wrapper"
    Get-ChildItem -Path $globalWrapper -Recurse -Filter "*.lck" -ErrorAction SilentlyContinue | ForEach-Object {
        $ok = Join-Path $_.DirectoryName ($_.BaseName + ".ok")
        if (Test-Path $ok) {
            Write-Host "Removing stale Gradle wrapper lock: $($_.FullName)"
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        }
    }

    $cacheRoots = @(
        (Join-Path $env:USERPROFILE ".gradle\caches\8.10.2\transforms"),
        (Join-Path $env:USERPROFILE ".gradle\caches\8.10.2\dependencies-accessors"),
        (Join-Path $env:USERPROFILE ".gradle\caches\8.10.2\kotlin-dsl"),
        (Join-Path $env:USERPROFILE ".gradle\caches\8.10.2\groovy-dsl"),
        (Join-Path $env:USERPROFILE ".gradle\daemon")
    )

    foreach ($cacheRoot in $cacheRoots) {
        if (Test-Path $cacheRoot) {
            Write-Host "Clearing $cacheRoot"
            Remove-Item -Recurse -Force $cacheRoot -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-GradleSanityCheck {
    param([string] $ArchitectureLabel)

    Write-Host "Gradle sanity check (:app:assembleDebug, ABI=$ArchitectureLabel) ..."
    Set-Location $androidRoot

    for ($attempt = 1; $attempt -le 2; $attempt++) {
        if ($attempt -gt 1) {
            Write-Host "Gradle retry $attempt/2 after cache repair ..."
            Clear-NativeBuildLocks -AndroidDir $androidRoot -MonorepoRoot $mobileRoot -AppRoot $appRoot
            Repair-GlobalGradleCaches
        }
        Repair-GradleCache -AndroidDir $androidRoot

        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & .\gradlew.bat :app:assembleDebug --no-daemon --no-parallel 2>&1 | ForEach-Object { Write-Host $_ }
        $gradleExit = $LASTEXITCODE
        $ErrorActionPreference = $prevEap
        if ($gradleExit -eq 0) {
            return 0
        }
    }

    return 1
}

function Remove-BrokenRootExpoStub {
    param([string] $MonorepoRoot)

    $stub = Join-Path $MonorepoRoot "node_modules\expo"
    $config = Join-Path $stub "config.js"
    if ((Test-Path $stub) -and -not (Test-Path $config)) {
        Write-Host "Removing incomplete root expo stub (breaks babel-preset-expo): $stub"
        $emptyDir = Join-Path $env:TEMP ("ancap-empty-" + [Guid]::NewGuid().ToString("n"))
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        try {
            robocopy $emptyDir $stub /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
            Remove-Item $stub -Force -Recurse -ErrorAction SilentlyContinue
        } finally {
            Remove-Item $emptyDir -Force -Recurse -ErrorAction SilentlyContinue
        }
    }
}

function Ensure-AppModuleLink {
    param([string] $AppRoot, [string] $MonorepoRoot, [string] $PackageName)

    $appModule = Join-Path $AppRoot "node_modules\$PackageName"
    $rootModule = Join-Path $MonorepoRoot "node_modules\$PackageName"
    if (-not (Test-Path $rootModule)) {
        return
    }
    if (Test-Path $appModule) {
        return
    }

    $appNodeModules = Join-Path $AppRoot "node_modules"
    if (-not (Test-Path $appNodeModules)) {
        New-Item -ItemType Directory -Path $appNodeModules -Force | Out-Null
    }

    Write-Host "Linking $PackageName into app node_modules for Gradle autolinking ..."
    cmd /c mklink /J "$appModule" "$rootModule" | Out-Null
}

function Clear-NativeBuildLocks {
    param([string] $AndroidDir, [string] $MonorepoRoot, [string] $AppRoot)

    Stop-AllGradleDaemons

    $cxxRoots = @(
        (Join-Path $MonorepoRoot "node_modules\expo-modules-core\android\build"),
        (Join-Path $MonorepoRoot "node_modules\expo-modules-core\android\build\intermediates\cxx"),
        (Join-Path $MonorepoRoot "node_modules\react-native-screens\android\build\intermediates\cxx"),
        (Join-Path $MonorepoRoot "node_modules\react-native\ReactAndroid\build\intermediates\cxx"),
        (Join-Path $AppRoot "node_modules\expo-modules-core\android\build\intermediates\cxx"),
        (Join-Path $AppRoot "node_modules\react-native-screens\android\build\intermediates\cxx"),
        (Join-Path $AppRoot "node_modules\expo-modules-core\android\.cxx"),
        (Join-Path $AndroidDir "app\build\intermediates\cxx"),
        (Join-Path $AndroidDir "app\.cxx")
    )

    foreach ($path in $cxxRoots) {
        if (Test-Path $path) {
            Write-Host "Clearing stale native/gradle cache: $path"
            Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        }
    }
}

if (-not (Test-Path $androidRoot)) {
    Write-Error "Android project not found at $androidRoot. Run 'npx expo prebuild' if android/ is missing."
}

Assert-AndroidStudioClosed

$sdkPath = Resolve-AndroidSdkPath
if (-not $sdkPath) {
    Write-Error "Android SDK not found. Install Android Studio and the Android SDK, or set ANDROID_HOME."
}
Ensure-AndroidCmdlineTools -SdkPath $sdkPath

$nodeDir = Resolve-NodeDir
if (-not $nodeDir) {
    Write-Error "Node.js not found. Install Node 20+ and ensure 'node' is on PATH, or set NODE_BINARY."
}

$jbr = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $jbr) {
    $env:JAVA_HOME = $jbr
    Write-Host "JAVA_HOME=$env:JAVA_HOME"
} elseif (-not $env:JAVA_HOME) {
    Write-Warning "JAVA_HOME is unset. Set it to Android Studio JBR if Gradle sync fails."
}

$env:NODE_ENV = "development"
$env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"

Write-Host "Installing npm workspaces under $mobileRoot ..."
Set-Location $mobileRoot
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npm install 2>&1 | ForEach-Object { Write-Host $_ }
$npmExit = $LASTEXITCODE
$ErrorActionPreference = $prevEap
if ($npmExit -ne 0) { exit $npmExit }
Remove-BrokenRootExpoStub -MonorepoRoot $mobileRoot

# RN Gradle autolinking still expects some native deps under the app node_modules/.
foreach ($pkg in @("react-native-screens")) {
    Ensure-AppModuleLink -AppRoot $appRoot -MonorepoRoot $mobileRoot -PackageName $pkg
}

# babel-preset-expo is hoisted to the monorepo root; it must resolve expo/config from there.
if (-not (Test-Path (Join-Path $mobileRoot "node_modules\expo\config.js"))) {
    Write-Error "Missing root node_modules/expo after npm install. Run 'npm install' in ancap-mobile and retry."
}

$props = @(
    "sdk.dir=$(Escape-LocalPropertiesPath $sdkPath)",
    "node.dir=$(Escape-LocalPropertiesPath $nodeDir)"
)
Set-Content -Path $localProps -Value ($props -join "`n") -Encoding ascii
Write-Host "Wrote $localProps"

Set-GradleArchitecture -Arch $Architecture
Sync-ReactNativeVersionCatalog -AndroidDir $androidRoot -MonorepoRoot $mobileRoot
Bootstrap-LocalGradleHome -AndroidDir $androidRoot
Set-GradleUserHomeJvmArg -AndroidDir $androidRoot
Ensure-AndroidStudioIdeConfig -AndroidDir $androidRoot
$env:GRADLE_USER_HOME = "C:\gradle-ancap"

if ($BuildNative) {
    Write-Host "Building Rust FFI (.so) for Android ..."
    & (Join-Path $PSScriptRoot "build-android-native.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "Skipping native FFI build (pass -BuildNative to compile libacp_mobile_ffi.so)."
}

Clear-NativeBuildLocks -AndroidDir $androidRoot -MonorepoRoot $mobileRoot -AppRoot $appRoot
Repair-GlobalGradleCaches

if (-not $SkipGradleCheck) {
    $gradleExit = Invoke-GradleSanityCheck -ArchitectureLabel $Architecture
    if ($gradleExit -ne 0) { exit $gradleExit }
}

Write-Host ""
Write-Host "Open Android Studio (IMPORTANT - use this script, not the desktop icon):"
Write-Host "  .\ancap-mobile\scripts\open-android-studio.ps1"
Write-Host ""
Write-Host "Then: File -> Sync Project with Gradle Files"
Write-Host "Run configuration: app (debug)"
Write-Host ""
Write-Host "ABI tips:"
Write-Host "  - Windows emulator: x86_64 (default)"
Write-Host "  - Physical phone:   .\ancap-mobile\scripts\prepare-android-studio.ps1 -Architecture arm64-v8a"
Write-Host ""
Write-Host "Do NOT open the ANCAP repo root or ancap-mobile/ in Android Studio - only the android/ folder above."
