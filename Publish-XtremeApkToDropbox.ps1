param(
    # App name used in the APK filename (e.g. MAZEFLIX-v1.2.apk)
    [string]$AppName      = "MAZEFLIX",

    # Folder where Gradle puts the release APKs
    [string]$ReleaseDir   = "C:\Users\Willie Mayes\Downloads\XtremeStreamPlayer\XtremeStreamPlayer\android\app\build\outputs\apk\release",

    # Your Dropbox API token (from app console)
    [string]$DropboxToken = "<PUT_YOUR_DROPBOX_TOKEN_HERE>",

    # Folder in Dropbox where you want the APK
    [string]$DropboxFolder = "/MAZEFLIX"
)

Write-Host "=== $AppName → Dropbox Publisher ===" -ForegroundColor Cyan

# Find the latest MAZEFLIX-v*.apk in the release folder
$apkPattern = "$AppName-v*.apk"

if (-not (Test-Path -Path $ReleaseDir)) {
    Write-Host "❌ Release directory not found: $ReleaseDir" -ForegroundColor Red
    exit 1
}

$latestApk = Get-ChildItem -Path $ReleaseDir -Filter $apkPattern -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $latestApk) {
    Write-Host "❌ No APK matching pattern '$apkPattern' found in:" -ForegroundColor Red
    Write-Host "   $ReleaseDir" -ForegroundColor Red
    exit 1
}

$LocalApkPath = $latestApk.FullName
Write-Host "📁 Found latest APK: $LocalApkPath" -ForegroundColor Yellow

$fileName    = $latestApk.Name
$dropboxPath = "$DropboxFolder/$fileName"

Write-Host "📦 Uploading '$fileName' to Dropbox path '$dropboxPath'..." -ForegroundColor Yellow

# Read file as bytes
$bytes = [System.IO.File]::ReadAllBytes($LocalApkPath)

# 1) Upload file to Dropbox (overwrite if exists)
$uploadHeaders = @{
    "Authorization"   = "Bearer $DropboxToken"
    "Dropbox-API-Arg" = ("{""path"":""{0}"",""mode"":""overwrite"",""mute"":true,""strict_conflict"":false}" -f $dropboxPath)
    "Content-Type"    = "application/octet-stream"
}

$uploadUri = "https://content.dropboxapi.com/2/files/upload"

try {
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uploadHeaders -Body $bytes
    Write-Host "✅ Upload complete: $($uploadResponse.path_display)" -ForegroundColor Green
} catch {
    Write-Host "❌ Upload failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 2) Create or fetch a shared link
$apiHeaders = @{
    "Authorization" = "Bearer $DropboxToken"
    "Content-Type"  = "application/json"
}

$createSharedUri = "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings"
$listSharedUri   = "https://api.dropboxapi.com/2/sharing/list_shared_links"

$sharedUrl = $null

try {
    $body = @{
        path     = $uploadResponse.path_lower
        settings = @{
            requested_visibility = "public"
        }
    } | ConvertTo-Json

    $sharedResponse = Invoke-RestMethod -Uri $createSharedUri -Method Post -Headers $apiHeaders -Body $body
    $sharedUrl = $sharedResponse.url
    Write-Host "🔗 New shared link created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Shared link may already exist, trying to fetch it..." -ForegroundColor Yellow

    $body = @{
        path        = $uploadResponse.path_lower
        direct_only = $true
    } | ConvertTo-Json

    try {
        $listResponse = Invoke-RestMethod -Uri $listSharedUri -Method Post -Headers $apiHeaders -Body $body
        if ($listResponse.links.Count -gt 0) {
            $sharedUrl = $listResponse.links[0].url
            Write-Host "✅ Existing shared link found." -ForegroundColor Green
        } else {
            Write-Host "❌ No shared link found and creation failed." -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Could not get or create shared link." -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}

# 3) Convert to direct download URL
if ($sharedUrl -match "dl=0") {
    $directUrl = $sharedUrl -replace "dl=0","dl=1"
} elseif ($sharedUrl -notmatch "\?") {
    $directUrl = "$sharedUrl?dl=1"
} else {
    $directUrl = $sharedUrl
}

Write-Host ""
Write-Host "🎯 Direct download URL (use this in your downloader page):" -ForegroundColor Cyan
Write-Host $directUrl -ForegroundColor Green
Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
