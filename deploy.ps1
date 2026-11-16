# Uploads the website to Hostinger over encrypted FTP (FTPS).
# Run it from this folder:  powershell -ExecutionPolicy Bypass -File .\deploy.ps1
# It asks for your FTP password privately. The password is not saved anywhere.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Upload Sea Transport website to Hostinger" -ForegroundColor Cyan
Write-Host "Find these in Hostinger: Websites > raajjelove.com > Files > FTP Accounts" -ForegroundColor Gray
Write-Host ""

$ftpHost = Read-Host "FTP host (e.g. ftp.raajjelove.com or 179.61.189.52)"
$ftpUser = Read-Host "FTP username (e.g. u353993764)"
$secure  = Read-Host "FTP password" -AsSecureString
$ftpPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

$defaultDir = "domains/raajjelove.com/public_html/sea"
$remoteDir = Read-Host "Folder for sea.raajjelove.com [press Enter for $defaultDir]"
if ([string]::IsNullOrWhiteSpace($remoteDir)) { $remoteDir = $defaultDir }
$remoteDir = $remoteDir.Trim().Trim("/")

# Safety: never upload into the main website folder itself
if ($remoteDir -match '(^|/)public_html$') {
  Write-Host "Stopped: '$remoteDir' is your MAIN website folder. Use the 'sea' subfolder." -ForegroundColor Red
  exit 1
}

# Only the website files. data/, .git/, .claude/ are never uploaded.
$files = @("index.html", "api.php") +
  (Get-ChildItem -Recurse -File css, js, images | ForEach-Object { Resolve-Path -Relative $_.FullName })
$files = $files | ForEach-Object { ($_ -replace '^\.\\', '') -replace '\\', '/' }

$netrc = Join-Path $env:TEMP ("ftp-" + [guid]::NewGuid() + ".netrc")
try {
  # Credentials go in a temporary file (not on the command line) and are deleted afterwards
  Set-Content -Path $netrc -Value "machine $ftpHost login $ftpUser password $ftpPass" -Encoding ascii
  $ok = 0
  foreach ($f in $files) {
    Write-Host "  uploading $f ..." -NoNewline
    & curl.exe --silent --show-error --ssl-reqd --ftp-create-dirs --netrc-file $netrc `
      -T $f "ftp://$ftpHost/$remoteDir/$f"
    if ($LASTEXITCODE -eq 0) { Write-Host " done" -ForegroundColor Green; $ok++ }
    else { Write-Host " FAILED" -ForegroundColor Red }
  }
} finally {
  Remove-Item $netrc -ErrorAction SilentlyContinue
  $ftpPass = $null
}

Write-Host ""
if ($ok -eq $files.Count) {
  Write-Host "All $ok files uploaded. Open https://sea.raajjelove.com" -ForegroundColor Green
  Write-Host "Tip: if Hostinger's placeholder page still shows, delete 'default.php' in the sea folder." -ForegroundColor Gray
} else {
  Write-Host "$ok of $($files.Count) files uploaded. Check the host, username, password and folder." -ForegroundColor Yellow
}
