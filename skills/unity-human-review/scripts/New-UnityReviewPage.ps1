[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ManifestPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Encode-Html([object]$Value) {
    if ($null -eq $Value) {
        return ''
    }
    return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function Resolve-EvidencePath([string]$Path, [string]$ManifestDirectory) {
    if ([string]::IsNullOrWhiteSpace($Path)) {
        throw 'Evidence path must not be blank.'
    }
    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }
    return [System.IO.Path]::GetFullPath(
        [System.IO.Path]::Combine($ManifestDirectory, $Path))
}

function Get-ImageDataUri([string]$Path) {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -lt 12) {
        throw "Review image is too short to identify: $Path"
    }
    $mime = if (
        $bytes[0] -eq 0x89 -and
        $bytes[1] -eq 0x50 -and
        $bytes[2] -eq 0x4E -and
        $bytes[3] -eq 0x47) {
        'image/png'
    } elseif (
        $bytes[0] -eq 0xFF -and
        $bytes[1] -eq 0xD8 -and
        $bytes[2] -eq 0xFF) {
        'image/jpeg'
    } elseif (
        [Text.Encoding]::ASCII.GetString($bytes, 0, 4) -eq 'RIFF' -and
        [Text.Encoding]::ASCII.GetString($bytes, 8, 4) -eq 'WEBP') {
        'image/webp'
    } else {
        throw "Unsupported review image content: $Path"
    }
    return "data:$mime;base64,$([Convert]::ToBase64String($bytes))"
}

function Read-Property([object]$Object, [string]$Name) {
    if ($null -eq $Object) {
        return $null
    }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }
    return $property.Value
}

function Add-FactRow(
    [System.Text.StringBuilder]$Builder,
    [string]$Label,
    [object]$Value) {
    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        return
    }
    [void]$Builder.Append('<tr><th>')
    [void]$Builder.Append((Encode-Html $Label))
    [void]$Builder.Append('</th><td>')
    [void]$Builder.Append((Encode-Html $Value))
    [void]$Builder.Append('</td></tr>')
}

function Add-SourceFiles(
    [System.Text.StringBuilder]$Builder,
    [object[]]$SourceFiles,
    [string]$ManifestDirectory) {
    if ($null -eq $SourceFiles -or $SourceFiles.Count -eq 0) {
        return
    }

    [void]$Builder.Append('<section class="sources"><h4>Source files</h4><table>')
    foreach ($source in $SourceFiles) {
        $declaredPath = if ($source -is [string]) {
            $source
        } else {
            Read-Property $source 'path'
        }
        $expectedHash = if ($source -is [string]) {
            $null
        } else {
            Read-Property $source 'sha256'
        }
        $resolved = Resolve-EvidencePath $declaredPath $ManifestDirectory
        if (-not [System.IO.File]::Exists($resolved)) {
            throw "Evidence file does not exist: $resolved"
        }
        $actualHash = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash
        if (-not [string]::IsNullOrWhiteSpace([string]$expectedHash) -and
            -not [string]::Equals(
                [string]$expectedHash,
                $actualHash,
                [StringComparison]::OrdinalIgnoreCase)) {
            throw "SHA-256 mismatch for '$resolved'. Expected $expectedHash; actual $actualHash."
        }

        [void]$Builder.Append('<tr><td>')
        [void]$Builder.Append((Encode-Html $resolved))
        [void]$Builder.Append('</td><td><code>')
        [void]$Builder.Append((Encode-Html $actualHash))
        [void]$Builder.Append('</code></td></tr>')
    }
    [void]$Builder.Append('</table></section>')
}

function Add-ImageReview(
    [System.Text.StringBuilder]$Builder,
    [string]$EvidenceId,
    [string]$ImagePath) {
    $uri = Get-ImageDataUri $ImagePath
    [void]$Builder.Append('<figure class="capture">')
    [void]$Builder.Append('<div class="image-wrap"><img alt="')
    [void]$Builder.Append((Encode-Html $EvidenceId))
    [void]$Builder.Append('" src="')
    [void]$Builder.Append($uri)
    [void]$Builder.Append('"><div class="review-grid">')

    $columns = 12
    $rows = 8
    for ($row = 1; $row -le $rows; $row++) {
        for ($column = 1; $column -le $columns; $column++) {
            $columnName = [char](64 + $column)
            $region = "$columnName$row"
            $container = "$EvidenceId | region $region"
            [void]$Builder.Append('<div class="grid-cell" data-container="')
            [void]$Builder.Append((Encode-Html $container))
            [void]$Builder.Append('"><span>')
            [void]$Builder.Append($region)
            [void]$Builder.Append('</span></div>')
        }
    }
    [void]$Builder.Append('</div></div><figcaption>')
    [void]$Builder.Append((Encode-Html $ImagePath))
    [void]$Builder.Append('</figcaption></figure>')
}

$resolvedManifest = [System.IO.Path]::GetFullPath($ManifestPath)
if (-not [System.IO.File]::Exists($resolvedManifest)) {
    throw "Manifest does not exist: $resolvedManifest"
}

$manifestDirectory = [System.IO.Path]::GetDirectoryName($resolvedManifest)
$manifest = Get-Content -Raw -LiteralPath $resolvedManifest |
    ConvertFrom-Json

$title = Read-Property $manifest 'title'
$runId = Read-Property $manifest 'run_id'
$reviewKind = Read-Property $manifest 'review_kind'
$evidence = @(Read-Property $manifest 'evidence')
if ([string]::IsNullOrWhiteSpace([string]$title) -or
    [string]::IsNullOrWhiteSpace([string]$runId) -or
    [string]::IsNullOrWhiteSpace([string]$reviewKind) -or
    $evidence.Count -eq 0) {
    throw 'Manifest requires title, run_id, review_kind, and nonempty evidence.'
}

$ids = @{}
$body = [System.Text.StringBuilder]::new()
foreach ($item in $evidence) {
    $id = [string](Read-Property $item 'id')
    $itemTitle = [string](Read-Property $item 'title')
    if ([string]::IsNullOrWhiteSpace($id) -or
        [string]::IsNullOrWhiteSpace($itemTitle)) {
        throw 'Every evidence item requires id and title.'
    }
    if ($ids.ContainsKey($id)) {
        throw "Duplicate evidence id: $id"
    }
    $ids[$id] = $true

    [void]$body.Append('<article class="evidence" data-container="')
    [void]$body.Append((Encode-Html "$id | $itemTitle"))
    [void]$body.Append('"><header><span class="evidence-id">')
    [void]$body.Append((Encode-Html $id))
    [void]$body.Append('</span><h2 data-block="')
    [void]$body.Append((Encode-Html "$id title"))
    [void]$body.Append('">')
    [void]$body.Append((Encode-Html $itemTitle))
    [void]$body.Append('</h2></header>')

    $imagePath = Read-Property $item 'image_path'
    if (-not [string]::IsNullOrWhiteSpace([string]$imagePath)) {
        $resolvedImage = Resolve-EvidencePath $imagePath $manifestDirectory
        if (-not [System.IO.File]::Exists($resolvedImage)) {
            throw "Review image does not exist: $resolvedImage"
        }
        Add-ImageReview $body $id $resolvedImage
    }

    [void]$body.Append('<table class="facts">')
    Add-FactRow $body 'Scene' (Read-Property $item 'scene_path')
    Add-FactRow $body 'Scene GUID' (Read-Property $item 'scene_guid')
    Add-FactRow $body 'Camera' (Read-Property $item 'camera')
    Add-FactRow $body 'GlobalObjectId' (Read-Property $item 'global_object_id')
    Add-FactRow $body 'Frame' (Read-Property $item 'frame')
    Add-FactRow $body 'Time (seconds)' (Read-Property $item 'time_seconds')
    Add-FactRow $body 'Test case' (Read-Property $item 'test_case')
    Add-FactRow $body 'Log reference' (Read-Property $item 'log_reference')
    [void]$body.Append('</table>')

    $details = Read-Property $item 'details'
    if ($null -ne $details) {
        [void]$body.Append('<section><h4>Details</h4><table>')
        foreach ($property in $details.PSObject.Properties) {
            $value = if ($property.Value -is [string] -or
                $property.Value -is [ValueType]) {
                $property.Value
            } else {
                $property.Value | ConvertTo-Json -Depth 20 -Compress
            }
            Add-FactRow $body $property.Name $value
        }
        [void]$body.Append('</table></section>')
    }

    Add-SourceFiles $body @(Read-Property $item 'source_files') $manifestDirectory
    [void]$body.Append('</article>')
}

$summary = Read-Property $manifest 'summary'
$projectRoot = Read-Property $manifest 'project_root'
$unityVersion = Read-Property $manifest 'unity_version'
$generatedAt = [DateTimeOffset]::Now.ToString('o')

$html = @"
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>$(Encode-Html $title)</title>
<style>
:root { color-scheme: dark; font-family: Inter, Segoe UI, sans-serif; background:#0d1422; color:#e7edf6; }
body { margin:0 auto; max-width:1500px; padding:28px; }
h1,h2,h3,h4,p { margin-top:0; }
.run { background:#152238; border:1px solid #29405e; border-radius:12px; padding:18px; margin-bottom:24px; }
.run table,.facts,.sources table,.evidence section table { width:100%; border-collapse:collapse; }
th,td { border-bottom:1px solid #29364a; padding:8px 10px; text-align:left; vertical-align:top; }
th { width:180px; color:#9fb3cc; font-weight:600; }
code { overflow-wrap:anywhere; }
.evidence { background:#111c2e; border:1px solid #2a3c55; border-radius:12px; padding:18px; margin:0 0 26px; }
.evidence header { display:flex; gap:12px; align-items:baseline; }
.evidence-id { background:#285a8f; border-radius:999px; padding:4px 10px; font-weight:700; }
.capture { margin:16px 0; }
.image-wrap { position:relative; width:100%; }
.image-wrap img { display:block; width:100%; height:auto; }
.review-grid { position:absolute; inset:0; display:grid; grid-template-columns:repeat(12,1fr); grid-template-rows:repeat(8,1fr); pointer-events:auto; }
.grid-cell { border:1px solid rgba(255,255,255,.13); position:relative; }
.grid-cell span { background:rgba(0,0,0,.45); color:rgba(255,255,255,.8); font-size:10px; padding:1px 3px; }
.grid-cell:hover { background:rgba(57,145,255,.22); border-color:#65a8ff; }
figcaption { color:#91a4bb; font-size:12px; margin-top:6px; overflow-wrap:anywhere; }
</style>
</head>
<body>
<section class="run" data-container="Run $(Encode-Html $runId)">
<h1 data-block="Review title">$(Encode-Html $title)</h1>
<p data-block="Review summary">$(Encode-Html $summary)</p>
<table>
<tr><th>Run ID</th><td>$(Encode-Html $runId)</td></tr>
<tr><th>Review kind</th><td>$(Encode-Html $reviewKind)</td></tr>
<tr><th>Project root</th><td>$(Encode-Html $projectRoot)</td></tr>
<tr><th>Unity version</th><td>$(Encode-Html $unityVersion)</td></tr>
<tr><th>Generated</th><td>$(Encode-Html $generatedAt)</td></tr>
</table>
</section>
$body
</body>
</html>
"@

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($resolvedOutput)
if (-not [System.IO.Directory]::Exists($outputDirectory)) {
    [void][System.IO.Directory]::CreateDirectory($outputDirectory)
}
[System.IO.File]::WriteAllText(
    $resolvedOutput,
    $html,
    [System.Text.UTF8Encoding]::new($false))

Write-Output "UNITY_REVIEW_PAGE=$resolvedOutput"
Write-Output "EVIDENCE_COUNT=$($evidence.Count)"
