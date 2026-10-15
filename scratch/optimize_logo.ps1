Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\pablo.carrascal\Documents\dulce-tentacion"
$srcPath = Join-Path $baseDir "logo-pys-original.png"
$dstPath = Join-Path $baseDir "logo-pys.png"

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$origW = $srcImg.Width
$origH = $srcImg.Height

$maxDim = 500
if ($origW -gt $origH) {
    $newW = $maxDim
    $newH = [int](($origH * $maxDim) / $origW)
} else {
    $newH = $maxDim
    $newW = [int](($origW * $maxDim) / $origH)
}

$bmp = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graph = [System.Drawing.Graphics]::FromImage($bmp)

$graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$graph.Clear([System.Drawing.Color]::Transparent)
$graph.DrawImage($srcImg, 0, 0, $newW, $newH)

$srcImg.Dispose()
$graph.Dispose()

$tmpPath = Join-Path $baseDir "logo-pys-opt.png"
$bmp.Save($tmpPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Move-Item -Force $tmpPath $dstPath
$finalSize = (Get-Item $dstPath).Length
Write-Host "OPTIMIZATION_SUCCESS: $newW x $newH - Final Size: $finalSize bytes"
