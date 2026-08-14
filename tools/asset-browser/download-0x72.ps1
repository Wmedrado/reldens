$ErrorActionPreference = 'Stop'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VibecraftAssetTool/1.0'
$stage = 'F:\reldens\assets-cc0\_staging'
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$null = Invoke-WebRequest -Uri 'https://0x72.itch.io/dungeontileset-ii' -UserAgent $ua -WebSession $s -TimeoutSec 60
$html = [System.IO.File]::ReadAllText("$stage\0x72-page.html")
$token = [regex]::Match($html, 'name="csrf_token" value="([^"]+)"').Groups[1].Value

foreach ($uid in @(1736189, 2275908, 9911410)) {
    $body = @{ upload_id = $uid; csrf_token = $token } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "https://0x72.itch.io/dungeontileset-ii/download_url" -Method Post -Body $body -ContentType 'application/json' -UserAgent $ua -WebSession $s -TimeoutSec 60
    $out = "$stage\0x72-$uid.zip"
    Invoke-WebRequest -Uri $r.url -OutFile $out -UserAgent $ua -WebSession $s -TimeoutSec 600
    $size = [math]::Round((Get-Item $out).Length / 1KB, 0)
    Write-Host "$uid => $size KB"
}
