# Builds the frontend and backend into ONE folder that can be hosted as a single IIS site.
#
#   Usage:  powershell -ExecutionPolicy Bypass -File .\publish.ps1
#           powershell -ExecutionPolicy Bypass -File .\publish.ps1 -Output D:\Deploy\JobBank
#
# Result (default .\publish):
#   JobBank.Api.dll, web.config, appsettings.json ...   <- ASP.NET Core API
#   parse_cv.py, requirements.txt                       <- CV parser run by the API
#   wwwroot\index.html, wwwroot\assets\...              <- React site

param(
    [string]$Output = (Join-Path $PSScriptRoot "publish")
)

$ErrorActionPreference = "Stop"
$frontend = Join-Path $PSScriptRoot "frontend"
$backend  = Join-Path $PSScriptRoot "backend"

function Invoke-Step($name, [scriptblock]$action) {
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    & $action
    if ($LASTEXITCODE -ne 0) { throw "$name failed (exit code $LASTEXITCODE)" }
}

if (Test-Path $Output) { Remove-Item $Output -Recurse -Force }

Push-Location $frontend
try {
    Invoke-Step "Installing frontend packages" { npm install }
    Invoke-Step "Building frontend" { npm run build }
} finally { Pop-Location }

Invoke-Step "Publishing backend" {
    dotnet publish (Join-Path $backend "JobBank.Api.csproj") -c Release -o $Output
}

Write-Host "`n=== Combining into one folder ===" -ForegroundColor Cyan
$wwwroot = Join-Path $Output "wwwroot"
New-Item -ItemType Directory -Force $wwwroot | Out-Null
Copy-Item (Join-Path $frontend "dist\*") $wwwroot -Recurse -Force
New-Item -ItemType Directory -Force (Join-Path $wwwroot "uploads") | Out-Null
Copy-Item (Join-Path $backend "parse_cv.py")      $Output -Force
Copy-Item (Join-Path $backend "requirements.txt") $Output -Force

Write-Host "`nDone. Copy this folder to the IIS server:" -ForegroundColor Green
Write-Host "  $Output"
Write-Host "When updating an existing site, do NOT overwrite the server's wwwroot\uploads folder (it holds user files)." -ForegroundColor Yellow
