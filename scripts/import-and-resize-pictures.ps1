param(
    [string]$SourceDir = "C:\Users\Promedeca\Documents\Codex\2026-11-03\you-are-a-senior-3d-children\outputs",
    [string]$DestDir = "D:\PapulaMobile\assets\pictures",
    [int]$TargetSize = 384
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $SourceDir)) {
    Write-Error "Source directory not found: $SourceDir"
    exit 1
}

if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}

$files = Get-ChildItem -Path $SourceDir -Filter "*.png" | Sort-Object Name
Write-Host "Found $($files.Count) PNG files in source directory."

$count = 0
$totalOrigSize = 0
$totalNewSize = 0

foreach ($file in $files) {
    $srcPath = $file.FullName
    $destPath = Join-Path $DestDir $file.Name

    $totalOrigSize += $file.Length

    $stream = [System.IO.File]::OpenRead($srcPath)
    $srcBitmap = [System.Drawing.Bitmap]::FromStream($stream)

    $dstBitmap = New-Object System.Drawing.Bitmap($TargetSize, $TargetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dstBitmap)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($srcBitmap, 0, 0, $TargetSize, $TargetSize)

    $dstBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $dstBitmap.Dispose()
    $srcBitmap.Dispose()
    $stream.Dispose()

    $newFileLen = (Get-Item $destPath).Length
    $totalNewSize += $newFileLen

    $count++
    if ($count % 25 -eq 0 -or $count -eq $files.Count) {
        Write-Host "Processed $count / $($files.Count) files..."
    }
}

$origMB = [Math]::Round($totalOrigSize / 1MB, 2)
$newMB = [Math]::Round($totalNewSize / 1MB, 2)
$savedPct = [Math]::Round((1 - ($totalNewSize / $totalOrigSize)) * 100, 1)

Write-Host "Successfully resized and imported $count pictures."
Write-Host "Original Total: $origMB MB"
Write-Host "New Total: $newMB MB"
Write-Host "Space Saved: $savedPct %"
