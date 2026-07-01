# Quick repair when Android Studio sync fails with metadata.bin / transforms errors.
# Close Android Studio first, then:
#   .\ancap-mobile\scripts\fix-gradle-cache.ps1

$ErrorActionPreference = "Stop"

$mobileRoot = Split-Path $PSScriptRoot -Parent
$androidRoot = Join-Path $mobileRoot "apps\acp-wallet-expo\android"
$localGradleHome = "C:\gradle-ancap"

function Ensure-AndroidCmdlineTools {
    param([string] $SdkPath)

    $sdkmanager = Join-Path $SdkPath "cmdline-tools\latest\bin\sdkmanager.bat"
    if (Test-Path $sdkmanager) {
        Write-Host "Android SDK cmdline-tools OK"
        return
    }

    Write-Host "Installing Android SDK command-line tools ..."
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
    } finally {
        Remove-Item $zip -Force -ErrorAction SilentlyContinue
        Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Assert-AndroidStudioClosed {
    $studio = Get-Process -Name "studio64" -ErrorAction SilentlyContinue
    if ($studio) {
        Write-Host "Closing Android Studio to avoid Gradle cache races on Windows ..."
        $studio | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
    }
}

function Stop-GradleJavaProcesses {
    Get-Process -Name "java" -ErrorAction SilentlyContinue | ForEach-Object {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmd -match "GradleDaemon|org\.gradle|kotlin-daemon") {
            Write-Host "Stopping PID $($_.Id)"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
    Get-ChildItem (Join-Path $localGradleHome "caches") -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
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

function Bootstrap-LocalGradleHome {
    if (-not (Test-Path $localGradleHome)) {
        New-Item -ItemType Directory -Path $localGradleHome -Force | Out-Null
    }

    $globalDists = Join-Path $env:USERPROFILE ".gradle\wrapper\dists"
    $localDists = Join-Path $localGradleHome "wrapper\dists"
    if ((Test-Path $globalDists) -and -not (Test-Path $localDists)) {
        Write-Host "Copying Gradle wrapper from global cache (one-time) ..."
        New-Item -ItemType Directory -Path (Split-Path $localDists -Parent) -Force | Out-Null
        Copy-Item -Path $globalDists -Destination $localDists -Recurse -Force
    }
}

function Set-GradleUserHomeInIde {
    $gradleXml = Join-Path $androidRoot ".idea\gradle.xml"
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
      </GradleProjectSettings>
    </option>
  </component>
</project>
"@ | Set-Content -Path $gradleXml -Encoding UTF8
        Write-Host "Created $gradleXml"
        return
    }

    [xml]$xml = Get-Content $gradleXml
    $settings = $xml.project.GradleSettings.linkedExternalProjectsSettings.GradleProjectSettings
    if (-not $settings) {
        Write-Warning "Unexpected gradle.xml shape; recreate manually if sync still fails."
        return
    }

    $existing = @($settings.option | Where-Object { $_.name -eq 'gradleUserHome' })
    if ($existing.Count -gt 0) {
        $existing[0].value = $homeValue
    } else {
        $opt = $xml.CreateElement('option')
        $opt.SetAttribute('name', 'gradleUserHome')
        $opt.SetAttribute('value', $homeValue)
        if ($settings.option.Count -gt 0) {
            [void]$settings.InsertBefore($opt, $settings.option[0])
        } else {
            [void]$settings.AppendChild($opt)
        }
    }
    $xml.Save($gradleXml)
    Write-Host "Set gradleUserHome in $gradleXml"
}

function Clear-CacheDir {
    param([string] $Path)
    if (-not (Test-Path $Path)) { return }
    Write-Host "Clearing $Path"
    Remove-Item -Recurse -Force $Path -ErrorAction SilentlyContinue
}

Assert-AndroidStudioClosed
Stop-GradleJavaProcesses

$sdkPath = Join-Path $env:LOCALAPPDATA "Android\Sdk"
if (Test-Path $sdkPath) { Ensure-AndroidCmdlineTools -SdkPath $sdkPath }

Push-Location $androidRoot
try {
    & .\gradlew.bat --stop 2>$null | Out-Null
} catch { }
Pop-Location

$appRoot = Join-Path $mobileRoot "apps\acp-wallet-expo"
$clearTargets = @(
    (Join-Path $androidRoot ".gradle"),
    (Join-Path $androidRoot "build"),
    (Join-Path $androidRoot "app\build"),
    (Join-Path $androidRoot "app\.cxx"),
    (Join-Path $androidRoot "app\build\intermediates\cxx"),
    (Join-Path $mobileRoot "node_modules\expo-modules-core\android\build"),
    (Join-Path $mobileRoot "node_modules\expo-modules-core\android\.cxx"),
    (Join-Path $mobileRoot "node_modules\react-native-screens\android\build\intermediates\cxx"),
    (Join-Path $localGradleHome "caches\8.10.2\transforms"),
    (Join-Path $localGradleHome "caches\8.10.2\dependencies-accessors"),
    (Join-Path $localGradleHome "caches\8.10.2\kotlin-dsl"),
    (Join-Path $localGradleHome "caches\8.10.2\groovy-dsl"),
    (Join-Path $localGradleHome "daemon"),
    (Join-Path $env:USERPROFILE ".gradle\caches\8.10.2\transforms"),
    (Join-Path $env:USERPROFILE ".gradle\caches\8.10.2\dependencies-accessors"),
    (Join-Path $env:USERPROFILE ".gradle\daemon")
)
foreach ($t in $clearTargets) { Clear-CacheDir $t }

Bootstrap-LocalGradleHome
Set-GradleUserHomeJvmArg -AndroidDir $androidRoot
Set-GradleUserHomeInIde

$jbr = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $jbr) { $env:JAVA_HOME = $jbr }
$env:GRADLE_USER_HOME = $localGradleHome

Write-Host "Running Gradle sync check ..."
Push-Location $androidRoot
& .\gradlew.bat help --no-daemon 2>&1 | ForEach-Object { Write-Host $_ }
$exit = $LASTEXITCODE
Pop-Location

if ($exit -ne 0) { exit $exit }

Write-Host ""
Write-Host "OK. Launch Android Studio with:"
Write-Host "  .\ancap-mobile\scripts\open-android-studio.ps1"
Write-Host ""
Write-Host "Then: File -> Sync Project with Gradle Files"
Write-Host "Do NOT open Studio from desktop shortcut (uses broken global Gradle cache)."
