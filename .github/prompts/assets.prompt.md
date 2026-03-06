---
name: assets
description: 'Generate all favicons, icons, and README banner from your logomark.'
agent: agent
tools: ['runInTerminal']
---

# Generate Brand Assets

Run the asset generator to produce all favicons, icons, and README banner from your logomark.

## Steps

1. Check that `public/brand/logomark.png` exists. If it doesn't, stop and tell the user:

   > "Drop your logomark at `public/brand/logomark.png` (1024×1024, transparent background) and re-run `/assets`."

2. Check that ImageMagick is installed by running `magick --version`. If it's not found, stop and tell the user:

   > "ImageMagick is required. Install it from https://imagemagick.org then re-run `/assets`."

3. Run the asset generator:

   ```powershell
   .\scripts\generate-assets.ps1
   ```

4. If the script succeeds, report which files were generated.

5. Commit the generated assets:
   ```powershell
   git add public/icon-light.png public/icon-dark.png public/brand/banner.png src/app/icon.png src/app/favicon.ico src/app/apple-icon.png
   git commit -m "assets: generate favicons, icons, and banner"
   ```

## Rules

- Never push — commit only.
- If the script errors, show the full output and stop.
- Do not modify any source files — this command only runs the generator and commits the output.
