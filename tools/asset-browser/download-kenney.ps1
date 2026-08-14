param(
    [string[]]$Slugs = @(
        'tiny-dungeon',
        'tiny-town',
        'tiny-battle',
        'micro-roguelike',
        '1-bit-pack',
        'rpg-urban-pack',
        'rpg-nature-tileset',
        'monster-builder-pack',
        'toon-characters-1',
        'roguelike-rpg-pack',
        'ui-pack',
        'fantasy-ui-borders',
        'game-icons',
        'particle-pack',
        'cursor-pack',
        'input-prompts',
        'rpg-audio',
        'digital-audio',
        'interface-sounds',
        'music-jingles',
        'impact-sounds'
    )
)

$ErrorActionPreference = 'Stop'
$root = 'F:\reldens\assets-cc0'
$stage = Join-Path $root '_staging'
$kenneyDir = Join-Path $root 'kenney'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VibecraftAssetTool/1.0'
$results = @()

foreach ($slug in $Slugs) {
    try {
        $pageUrl = "https://kenney.nl/assets/$slug"
        $page = Invoke-WebRequest -Uri $pageUrl -UserAgent $ua -TimeoutSec 60
        $html = $page.Content
        $match = [regex]::Match($html, 'https://kenney\.nl/media/pages/assets/[^"'']+?/kenney_[^"'']+?\.zip')
        if (-not $match.Success) {
            $results += [pscustomobject]@{ slug = $slug; status = 'NO_ZIP_URL'; size = 0 }
            Write-Host "SKIP $slug - no zip url"
            continue
        }
        $zipUrl = $match.Value
        $zipFile = Join-Path $stage "kenney_$slug.zip"
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UserAgent $ua -TimeoutSec 300
        $dest = Join-Path $kenneyDir $slug
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        Expand-Archive -Path $zipFile -DestinationPath $dest -Force
        $size = [math]::Round((Get-Item $zipFile).Length / 1MB, 1)
        $results += [pscustomobject]@{ slug = $slug; status = 'OK'; size = $size }
        Write-Host "OK $slug - $size MB"
    } catch {
        $results += [pscustomobject]@{ slug = $slug; status = "ERR: $($_.Exception.Message)"; size = 0 }
        Write-Host "ERR $slug - $($_.Exception.Message)"
    }
}

$results | Format-Table -AutoSize
$results | Export-Csv -Path (Join-Path $root '_staging\kenney-download-log.csv') -NoTypeInformation
