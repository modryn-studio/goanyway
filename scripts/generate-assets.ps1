# scripts/generate-assets.ps1
# ──────────────────────────────────────────────────────────────────────────────
# Generates all favicon, icon, OG image, and README banner assets from your
# logomark. Run from the project root after cloning, and again after any
# logomark or site.ts update.
#
# Requires: ImageMagick (magick) — https://imagemagick.org
#
# ── Inputs (you provide) ──────────────────────────────────────────────────────
#
#   REQUIRED:
#   public/brand/logomark.png       1024×1024 recommended.
#                                   Use a COLORED mark that works on both light
#                                   and dark backgrounds, OR a dark mark on
#                                   transparent bg if you want the auto-invert
#                                   dual-favicon mode (see below).
#
#   OPTIONAL — explicit dark-mode favicon override:
#   public/brand/logomark-dark.png  Overrides the auto-detected dark favicon.
#                                   Only needed for a hand-crafted dark version.
#                                   If absent, the script auto-detects mark type:
#                                   colored marks reuse logomark.png for both;
#                                   grayscale marks (black/white) auto-invert.
#
#   OPTIONAL — skipped if missing, auto-generated:
#   public/brand/banner.png         1280×320 README header image.
#                                   If absent, the script generates one from
#                                   your logomark + site name.
#
# ── Outputs (auto-generated — do not edit by hand) ───────────────────────────
#
#   public/icon-light.png           Favicon in light mode
#   public/icon-dark.png            Favicon in dark mode
#   public/icon.png                 1024×1024 for manifest + JSON-LD
#   public/favicon.ico              Legacy multi-res (48/32/16px)
#   src/app/apple-icon.png          180×180 iOS home screen (dark bg)
#   public/og-image.png             1200×630 social card
#   public/brand/banner.png         1280×320 README banner (if not provided)
#
# ─────────────────────────────────────────────────────────────────────────────

# Run from repo root regardless of where the script is called from
Set-Location (Split-Path -Parent $PSScriptRoot)

$logomark     = "public\brand\logomark.png"
$logomarkDark = "public\brand\logomark-dark.png"
$logomarkBare = "public\brand\logomark-bare.png"  # bare mark (no bg)  used for favicons when present
$banner       = "public\brand\banner.png"

# ── Guards ────────────────────────────────────────────────────────────────────
if (-not (Test-Path $logomark)) {
    Write-Host ""
    Write-Host "  ERROR: $logomark not found." -ForegroundColor Red
    Write-Host "  Drop your logomark (1024x1024 recommended) at that path and re-run." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "  ERROR: ImageMagick not found." -ForegroundColor Red
    Write-Host "  Install from https://imagemagick.org then re-run." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ── Read site name + brand colors from site.ts ───────────────────────────────
$siteName   = "Your Site"
$bgColor    = "#111111"
$accentColor = "#6366f1"
$siteTs = "src\config\site.ts"
if (Test-Path $siteTs) {
    $nameLine = Select-String -Path $siteTs -Pattern "name:\s*'([^']+)'" | Select-Object -First 1
    if ($nameLine) {
        $match = [regex]::Match($nameLine.Line, "name:\s*'([^']+)'")
        if ($match.Success -and $match.Groups[1].Value -notmatch 'TODO') {
            $siteName = $match.Groups[1].Value
        }
    }
    $bgLine = Select-String -Path $siteTs -Pattern "bg:\s*'(#[0-9a-fA-F]{3,8})'" | Select-Object -First 1
    if ($bgLine) {
        $match = [regex]::Match($bgLine.Line, "bg:\s*'(#[0-9a-fA-F]{3,8})'")
        if ($match.Success) { $bgColor = $match.Groups[1].Value }
    }
    $accentLine = Select-String -Path $siteTs -Pattern "accent:\s*'(#[0-9a-fA-F]{3,8})'" | Select-Object -First 1
    if ($accentLine) {
        $match = [regex]::Match($accentLine.Line, "accent:\s*'(#[0-9a-fA-F]{3,8})'")
        if ($match.Success) { $accentColor = $match.Groups[1].Value }
    }
}

Write-Host ""
Write-Host "  Generating assets — site: $siteName" -ForegroundColor Cyan
Write-Host ""

# ── Detect mark type ─────────────────────────────────────────────────────────
# Reads max channel saturation from the logomark. Near-zero = grayscale
# (black, white, gray) — needs inversion when composited onto a dark bg.
# Colored marks (amber, blue, etc.) composite directly, no inversion.
$maxSat      = [float](magick $logomark -colorspace HSL -channel Saturation -separate -format "%[fx:maxima]" info: 2>$null)
$isGrayscale = $maxSat -lt 0.05
$negateFrag  = if ($isGrayscale) { @('-channel', 'RGB', '-negate') } else { @() }

# ── Favicon pair ─────────────────────────────────────────────────────────────
# DUAL MODE   — public/brand/logomark-dark.png exists (explicit override):
#               icon-light.png = logomark.png
#               icon-dark.png  = logomark-dark.png
#
# AUTO MODE   — only logomark.png, mark is grayscale (black/white/gray):
#               icon-light.png = logomark.png
#               icon-dark.png  = logomark.png (RGB-negated automatically)
#
# SINGLE MODE — only logomark.png, mark is colored:
#               icon-light.png = icon-dark.png = logomark.png (no change needed)
if (Test-Path $logomarkDark) {
    Write-Host "  favicon mode: DUAL (logomark.png + logomark-dark.png)" -ForegroundColor DarkGray
    $lightSrc = if (Test-Path $logomarkBare) { $logomarkBare } else { $logomark }
    Copy-Item $lightSrc     "public\icon-light.png"
    Copy-Item $logomarkDark "public\icon-dark.png"
} elseif ($isGrayscale) {
    Write-Host "  favicon mode: AUTO (grayscale detected, inverting for dark mode)" -ForegroundColor DarkGray
    Copy-Item $logomark "public\icon-light.png"
    magick $logomark -channel RGB -negate "public\icon-dark.png"
} else {
    Write-Host "  favicon mode: SINGLE (colored mark, used for both modes)" -ForegroundColor DarkGray
    Copy-Item $logomark "public\icon-light.png"
    Copy-Item $logomark "public\icon-dark.png"
}
Write-Host "  + public/icon-light.png"
Write-Host "  + public/icon-dark.png"

# ── icon.png: manifest + JSON-LD (dark bg, mark composited) ──────────────────
magick -size 1024x1024 xc:"$bgColor" `
    '(' $markSrc -trim +repage $negateFrag -resize 800x800 ')' `
    -gravity Center -composite "public\icon.png"
Copy-Item "public\icon.png" "src\app\icon.png"
Write-Host "  + public/icon.png + src/app/icon.png"

# ── apple-icon.png: iOS home screen (dark bg, 180x180) ───────────────────────
if (-not (Test-Path "src\app")) { New-Item -ItemType Directory -Path "src\app" | Out-Null }
magick -size 180x180 xc:"$bgColor" `
    '(' $markSrc -trim +repage $negateFrag -resize 140x140 ')' `
    -gravity Center -composite "src\app\apple-icon.png"
Write-Host "  + src/app/apple-icon.png"

# ── favicon.ico: legacy multi-resolution ─────────────────────────────────────
magick $markSrc -trim +repage -define icon:auto-resize=48,32,16 "public\favicon.ico"
Copy-Item "public\favicon.ico" "src\app\favicon.ico"
Write-Host "  + public/favicon.ico + src/app/favicon.ico"

# ── og-image.png: 1200x630 social card ───────────────────────────────────────
magick -size 1200x630 xc:"$bgColor" `
    '(' $logomark $negateFrag -resize 100x100 ')' `
    -gravity North -geometry +0+75 -composite `
    -gravity North -font "Arial-Bold" -pointsize 88 -fill "#e5e5e5" -annotate +0+230 $siteName `
    -fill "$accentColor" -draw "rectangle 0,618 1200,630" `
    "public\og-image.png"
Write-Host "  + public/og-image.png"

# ── banner.png: 1280x320 README header ───────────────────────────────────────
# Generated only if not already provided by the user.
if (Test-Path $banner) {
    Write-Host "  ~ public/brand/banner.png (skipped - file already exists)"
} else {
    Write-Host "  + public/brand/banner.png (auto-generated)"
    if (-not (Test-Path "public\brand")) { New-Item -ItemType Directory -Path "public\brand" | Out-Null }
    magick -size 1280x320 xc:"$bgColor" `
        '(' $markSrc -trim +repage $negateFrag -resize 160x160 ')' `
        -gravity West -geometry +100+0 -composite `
        -gravity West -font "Arial-Bold" -pointsize 72 -fill "#e5e5e5" -annotate +300+0 $siteName `
        $banner
}

Write-Host ""
Write-Host "  Done." -ForegroundColor Green
if ($siteName -eq "Your Site") {
    Write-Host "  Tip: fill in src/config/site.ts, then re-run to stamp your site name on" -ForegroundColor DarkGray
    Write-Host "       the OG image and banner." -ForegroundColor DarkGray
}
Write-Host ""
