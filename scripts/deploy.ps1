param (
    [string]$DeployPath = "C:\inetpub\wwwroot\TheodenClient\Clock"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Next.js build process..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Deployment aborted."
    exit $LASTEXITCODE
}

Write-Host "Build successful! Preparing deployment..." -ForegroundColor Cyan

# Ensure destination exists
if (-not (Test-Path $DeployPath)) {
    Write-Host "Creating destination directory: $DeployPath"
    New-Item -ItemType Directory -Force -Path $DeployPath | Out-Null
}

# Define files and folders to deploy
$ItemsToDeploy = @(
    ".next",
    "public",
    "server.js",
    "web.config",
    "package.json",
    "package-lock.json",
    "next.config.js",
    ".env"
)

Write-Host "Copying files to $DeployPath..." -ForegroundColor Cyan
foreach ($item in $ItemsToDeploy) {
    $sourceItem = Join-Path $PSScriptRoot "..\$item"
    $destItem = Join-Path $DeployPath $item

    if (Test-Path $sourceItem) {
        Write-Host "Copying $item..."
        Copy-Item -Path $sourceItem -Destination $DeployPath -Recurse -Force
    } else {
        Write-Warning "Item $item not found in source, skipping."
    }
}

Write-Host "Installing production dependencies in destination directory..." -ForegroundColor Cyan
Push-Location $DeployPath
try {
    npm install --omit=dev
} finally {
    Pop-Location
}

Write-Host "Deployment to $DeployPath completed successfully!" -ForegroundColor Green
Write-Host "Note: You might need to recycle the IIS Application Pool for the changes to take effect immediately." -ForegroundColor Yellow
