Param(
    [string]$ImagesDir = (Join-Path $PSScriptRoot '..\images\showcase'),
    [string]$OutputFile = (Join-Path $PSScriptRoot '..\showcase.json')
)

# Ensure images directory exists
if (-not (Test-Path $ImagesDir)) {
    New-Item -ItemType Directory -Path $ImagesDir | Out-Null
    Write-Host "Created images directory: $ImagesDir"
}

# Supported image extensions (order matters for Get-ChildItem results)
$patterns = '*.png','*.jpg','*.jpeg','*.webp','*.gif'

# Collect files
$files = @()
foreach ($p in $patterns) {
    $files += Get-ChildItem -Path $ImagesDir -Filter $p -File -ErrorAction SilentlyContinue
}
$files = $files | Sort-Object Name

# Build JSON array
$items = @()
foreach ($f in $files) {
    $alt = [IO.Path]::GetFileNameWithoutExtension($f.Name) -replace '[-_]+',' '
    $items += [PSCustomObject]@{
        src = "images/showcase/$($f.Name)"
        alt = $alt
    }
}

# Ensure output directory exists
$outDir = Split-Path -Parent $OutputFile
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Write JSON
$items | ConvertTo-Json -Depth 5 | Set-Content -Path $OutputFile -Encoding UTF8

Write-Host "Wrote $($items.Count) showcase item(s) to: $OutputFile"