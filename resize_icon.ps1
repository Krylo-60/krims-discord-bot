Add-Type -AssemblyName System.Drawing
$src = "C:\Users\naina\.gemini\antigravity\brain\00b316cf-2843-40c3-9037-0d534a8d9fd7\krylosmp_discord_icon.png"
$dst = "C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot\server_package\server-icon.png"
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$res = New-Object System.Drawing.Bitmap(64, 64)
$g = [System.Drawing.Graphics]::FromImage($res)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, 64, 64)
$g.Dispose()
$bmp.Dispose()
$res.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$res.Dispose()
Write-Host "✅ Created 64x64 server-icon.png!"
