#Requires -Version 5.1
<#
.SYNOPSIS
  Auto-version and export XtremeStreamPlayer APK builds.

.DESCRIPTION
  - Reads "version" from package.json
  - Increments patch number (x.y.Z)
  - Writes updated version back to package.json
  - Renames app-release.apk -> XtremeStreamPlayer-v<version>.apk
  - Copies versioned APK to a Dropbox "builds" folder
  - Appends an entry to a version history log
#>

param(
    # Root folder of the React Native project
    [string]$ProjectRoot = "C:\Users\Willie Mayes\Downloads\XtremeStreamPlayer\XtremeStreamPlayer",

    # Name used for the APK file
    [string]$AppName = "XtremeStreamPlayer",

    # Local Dropbox builds folder (edit this if yours is different)
    [string]$DropboxBuilds = "C:\Users\Willie Mayes\Dropbox\XtremeStreamPlayer\builds"
)

Write-Host "=== XtremeStreamPlayer Versioning ===" -ForegroundColor Cyan

# Paths
$PackageJsonPath = Join-Path $ProjectRoot "package.json"
$ApkFolder       = Join-Path $ProjectRoot "android\app\build\outputs\apk\release"
$SourceApk       = Join-Path $ApkFolder "app-release.apk"
$HistoryLog      = Join-Path $ProjectRoot "xtreme-version-history.log"

if (-not (Test-Path $PackageJsonPath)) {
    Write-Host "ERROR: package.json not found at $PackageJsonPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SourceApk)) {
    Write-Host "ERROR: APK not found at $SourceApk" -ForegroundColor Red
    Write-Host "Make sure you ran: cd android; .\gradlew.bat assembleRelease" -ForegroundColor Yellow
    exit 1
}

# Ensure Dropbox builds folder exists
if (-not (Test-Path $DropboxBuilds)) {
    Write-Host "Dropbox builds folder not found. Creating: $DropboxBuilds" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DropboxBuilds -Force | Out-Null
}

# --- STEP 1: Read and bump version in package.json ---
Write-Host "Reading package.json..." -ForegroundColor Cyan
$jsonRaw = Get-Content -Path $PackageJsonPath -Raw
$pkg     = $jsonRaw | ConvertFrom-Json

if (-not $pkg.version) {
    Write-Host "ERROR: No 'version' field found in package.json" -ForegroundColor Red
    exit 1
}

$oldVersion = $pkg.version
Write-Host "Current version: $oldVersion" -ForegroundColor DarkCyan

# Expect version in form: major.minor.patch
$parts = $oldVersion -split '\.'
if ($parts.Count -lt 3) {
    # If it’s weird, normalize to x.y.0
    Write-Host "Version format not standard (x.y.z). Normalizing..." -ForegroundColor Yellow
    while ($parts.Count -lt 3) {
        $parts += "0"
    }
}

[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

$patch++
$newVersion = "{0}.{1}.{2}" -f $major, $minor, $patch
Write-Host "Bumping version: $oldVersion -> $newVersion" -ForegroundColor Green

$pkg.version = $newVersion

# Write back pretty JSON
($pkg | ConvertTo-Json -Depth 10) | Set-Content -Path $PackageJsonPath -Encoding UTF8

# --- STEP 2: Build new APK file name ---
$versionedApkName = "{0}-v{1}.apk" -f $AppName, $newVersion
$VersionedApkPath = Join-Path $ApkFolder $versionedApkName

Write-Host "Renaming APK -> $versionedApkName" -ForegroundColor Cyan

# Copy (and rename) APK in the build folder
Copy-Item -Path $SourceApk -Destination $VersionedApkPath -Force

# --- STEP 3: Copy to Dropbox builds folder ---
$DropboxApkPath = Join-Path $DropboxBuilds $versionedApkName

Write-Host "Copying to Dropbox: $DropboxApkPath" -ForegroundColor Cyan
Copy-Item -Path $VersionedApkPath -Destination $DropboxApkPath -Force

# --- STEP 4: Append version history log ---
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logLine   = "{0}  |  v{1}  |  {2}" -f $timestamp, $newVersion, $DropboxApkPath

$logLine | Add-Content -Path $HistoryLog

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "New version: v$newVersion" -ForegroundColor Green
Write-Host "Local APK:   $VersionedApkPath" -ForegroundColor Gray
Write-Host "Dropbox APK: $DropboxApkPath" -ForegroundColor Gray
Write-Host "History log: $HistoryLog" -ForegroundColor Gray
Write-Host ""
Write-Host "Next step: Wait for Dropbox to sync, then right-click the APK in Dropbox and copy the share link." -ForegroundColor Cyan
