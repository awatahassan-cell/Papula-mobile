param([Parameter(Mandatory=$true)][string]$SourceDirectory)

# Generated sheets use two columns and three rows, in left-to-right reading order.
Add-Type -AssemblyName System.Drawing
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]90)
$projectRoot = Split-Path $PSScriptRoot -Parent
$targetDirectory = Join-Path $projectRoot 'assets/stories/original'
New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
$stories = [ordered]@{
    'butterfly' = @('morning_sun','butterfly_waking','garden_flying','bee_friend','rose_resting','happy_sunset')
    'fox-bear' = @('forest_bear','fox_pointing','honey_harvest','sharing')
    'stars-sky' = @('starry_night','deer_moon','moon_speaking','sleep_peace')
    'rabbit-turtle' = @('rabbit_boasting','turtle_challenge','rabbit_sleeping','turtle_walking','turtle_winner')
    'rain-rainbow' = @('cloud_sitting','rain_falling','sun_shining','rainbow_appears','children_happy')
    'ant-winter' = @('ant_summer','grasshopper_play','ant_working','winter_snow','lesson_learned')
    'lion-mouse' = @('lion_sleeping','mouse_running','mouse_spared','lion_trapped','mouse_cutting_net','lion_mouse_friends')
}
$imports = @()
$ratios = @()
foreach ($story in $stories.Keys) {
    $sheet = [System.Drawing.Bitmap]::new((Join-Path $SourceDirectory "$story.png"))
    try {
        for ($panelIndex = 0; $panelIndex -lt $stories[$story].Count; $panelIndex++) {
            $column = $panelIndex % 2
            $row = [math]::Floor($panelIndex / 2)
            $left = [int][math]::Floor($column * $sheet.Width / 2)
            $rowEdges = @(0, [int][math]::Floor($sheet.Height/3), [int][math]::Floor(2*$sheet.Height/3), $sheet.Height)
            # This sheet's painted row transitions differ slightly from an exact grid.
            if ($story -eq 'rain-rainbow') { $rowEdges = @(0,340,656,$sheet.Height) }
            $top = $rowEdges[$row]
            $right = [int][math]::Floor(($column + 1) * $sheet.Width / 2)
            $bottom = $rowEdges[$row+1]
            $rectangle = [System.Drawing.Rectangle]::new($left,$top,($right-$left),($bottom-$top))
            $panel = $sheet.Clone($rectangle,$sheet.PixelFormat)
            $theme = $stories[$story][$panelIndex]
            try { $panel.Save((Join-Path $targetDirectory "$theme.jpg"),$jpegEncoder,$encoderParameters) }
            finally { $panel.Dispose() }
            $imports += "  ${theme}: require('../../assets/stories/original/$theme.jpg'),"
            $ratio = (($right-$left)/($bottom-$top)).ToString('0.000000',[System.Globalization.CultureInfo]::InvariantCulture)
            $ratios += "  ${theme}: $ratio,"
        }
    } finally { $sheet.Dispose() }
}
$module = "/** Original story scenes, bundled for offline reading. See docs/story-art.md. */`nexport const storyIllustrations: Record<string, number> = {`n" + ($imports -join "`n") + "`n};`nexport const storyIllustrationAspectRatios: Record<string, number> = {`n" + ($ratios -join "`n") + "`n};`n"
[System.IO.File]::WriteAllText((Join-Path $projectRoot 'src/data/storyIllustrations.ts'),$module)
Write-Output "Prepared $($imports.Count) story illustrations."
$encoderParameters.Dispose()
