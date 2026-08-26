[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [Parameter(Mandatory = $true)]
    [string]$ManifestPath,

    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Normalize-RelativePath {
    param([string]$Path)
    return ($Path -replace '\\', '/').TrimStart('/')
}

function Get-Sha256 {
    param([string]$Path)
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToUpperInvariant()
}

function Get-ObjectProperty {
    param(
        [object]$Object,
        [string]$Name
    )
    if ($null -eq $Object) {
        return $null
    }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }
    return $property.Value
}

function Get-MetaGuid {
    param([string]$MetaPath)
    if (-not (Test-Path -LiteralPath $MetaPath -PathType Leaf)) {
        return $null
    }

    $match = Select-String -LiteralPath $MetaPath -Pattern '^guid:\s*([0-9a-fA-F]{32})\s*$' | Select-Object -First 1
    if ($null -eq $match) {
        return $null
    }

    return $match.Matches[0].Groups[1].Value.ToLowerInvariant()
}

function Add-Issue {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$Code,
        [string]$Path,
        [string]$Message
    )
    $List.Add([pscustomobject]@{ code = $Code; path = $Path; message = $Message })
}

$project = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $ProjectRoot).Path).TrimEnd('\', '/')
$manifestFile = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $ManifestPath).Path)
$manifest = Get-Content -Raw -LiteralPath $manifestFile | ConvertFrom-Json

$hard = New-Object 'System.Collections.Generic.List[object]'
$advisory = New-Object 'System.Collections.Generic.List[object]'
$assetResults = New-Object 'System.Collections.Generic.List[object]'

$schemaVersion = Get-ObjectProperty $manifest 'schemaVersion'
if ($schemaVersion -ne 1) {
    Add-Issue $hard 'manifest_schema' $manifestFile 'schemaVersion must equal 1.'
}

$manifestAssets = @()
$manifestAssetsValue = Get-ObjectProperty $manifest 'assets'
if ($null -ne $manifestAssetsValue) {
    $manifestAssets = @($manifestAssetsValue)
}
$manifestByPath = @{}
$manifestIds = @{}

foreach ($entry in $manifestAssets) {
    $relative = Normalize-RelativePath ([string](Get-ObjectProperty $entry 'path'))
    $id = [string](Get-ObjectProperty $entry 'id')
    $role = [string](Get-ObjectProperty $entry 'role')
    $provenance = [string](Get-ObjectProperty $entry 'provenance')
    $acceptanceId = [string](Get-ObjectProperty $entry 'acceptanceId')

    if ([string]::IsNullOrWhiteSpace($id)) { Add-Issue $hard 'manifest_id_missing' $relative 'Asset id is required.' }
    if ([string]::IsNullOrWhiteSpace($relative)) { Add-Issue $hard 'manifest_path_missing' $id 'Asset path is required.' }
    if ([string]::IsNullOrWhiteSpace($role)) { Add-Issue $hard 'manifest_role_missing' $relative 'Asset role is required.' }
    if ([string]::IsNullOrWhiteSpace($provenance)) { Add-Issue $hard 'manifest_provenance_missing' $relative 'Asset provenance is required.' }
    if ([string]::IsNullOrWhiteSpace($acceptanceId)) { Add-Issue $hard 'manifest_acceptance_missing' $relative 'Current acceptanceId is required.' }

    $idKey = $id.ToLowerInvariant()
    $pathKey = $relative.ToLowerInvariant()
    if ($manifestIds.ContainsKey($idKey)) { Add-Issue $hard 'manifest_duplicate_id' $relative "Duplicate asset id: $id" } else { $manifestIds[$idKey] = $true }
    if ($manifestByPath.ContainsKey($pathKey)) { Add-Issue $hard 'manifest_duplicate_path' $relative 'Duplicate manifest path.' } else { $manifestByPath[$pathKey] = $entry }

    if (-not $relative.StartsWith('Assets/', [System.StringComparison]::OrdinalIgnoreCase)) {
        Add-Issue $hard 'manifest_path_outside_assets' $relative 'Manifest paths must be under Assets/.'
        continue
    }

    $full = [System.IO.Path]::GetFullPath((Join-Path $project ($relative -replace '/', '\')))
    $assetsRoot = [System.IO.Path]::GetFullPath((Join-Path $project 'Assets'))
    if (-not $full.StartsWith($assetsRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        Add-Issue $hard 'manifest_path_escape' $relative 'Manifest path escapes the project Assets directory.'
        continue
    }

    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
        Add-Issue $hard 'asset_missing' $relative 'Manifest asset does not exist.'
        continue
    }

    $meta = $full + '.meta'
    $guid = Get-MetaGuid $meta
    if (-not (Test-Path -LiteralPath $meta -PathType Leaf)) {
        Add-Issue $hard 'meta_missing' $relative 'Asset meta file is missing.'
    } elseif ($null -eq $guid) {
        Add-Issue $hard 'meta_guid_invalid' ($relative + '.meta') 'Meta GUID is missing or malformed.'
    }

    $sha = Get-Sha256 $full
    $expectedGuid = ([string](Get-ObjectProperty $entry 'expectedGuid')).ToLowerInvariant()
    $expectedSha = ([string](Get-ObjectProperty $entry 'expectedSha256')).ToUpperInvariant()
    if (-not [string]::IsNullOrWhiteSpace($expectedGuid) -and $guid -ne $expectedGuid) {
        Add-Issue $hard 'guid_mismatch' $relative "Expected GUID $expectedGuid but found $guid."
    }
    if (-not [string]::IsNullOrWhiteSpace($expectedSha) -and $sha -ne $expectedSha) {
        Add-Issue $hard 'sha256_mismatch' $relative "Expected SHA-256 $expectedSha but found $sha."
    }

    $assetResults.Add([pscustomobject]@{
        id = $id
        path = $relative
        role = $role
        guid = $guid
        sha256 = $sha
        bytes = (Get-Item -LiteralPath $full).Length
    })
}

$rootPaths = @()
$rootPathsValue = Get-ObjectProperty $manifest 'assetRoots'
if ($null -ne $rootPathsValue) {
    $rootPaths = @($rootPathsValue)
}
if ($rootPaths.Count -eq 0) {
    Add-Issue $hard 'asset_roots_missing' $manifestFile 'assetRoots must list at least one formal asset root.'
}

$allManagedFiles = New-Object 'System.Collections.Generic.List[object]'
$allMetaFiles = New-Object 'System.Collections.Generic.List[object]'
foreach ($rootEntry in $rootPaths) {
    $relativeRoot = Normalize-RelativePath ([string]$rootEntry)
    if (-not $relativeRoot.StartsWith('Assets', [System.StringComparison]::OrdinalIgnoreCase)) {
        Add-Issue $hard 'asset_root_outside_assets' $relativeRoot 'assetRoots entries must be under Assets.'
        continue
    }

    $fullRoot = [System.IO.Path]::GetFullPath((Join-Path $project ($relativeRoot -replace '/', '\')))
    if (-not (Test-Path -LiteralPath $fullRoot -PathType Container)) {
        Add-Issue $hard 'asset_root_missing' $relativeRoot 'Declared formal asset root does not exist.'
        continue
    }

    foreach ($file in Get-ChildItem -LiteralPath $fullRoot -Recurse -File) {
        $relativeFile = Normalize-RelativePath $file.FullName.Substring($project.Length + 1)
        if ($file.Extension -ieq '.meta') {
            $allMetaFiles.Add([pscustomobject]@{ file = $file; path = $relativeFile })
        } else {
            $allManagedFiles.Add([pscustomobject]@{ file = $file; path = $relativeFile })
            if (-not $manifestByPath.ContainsKey($relativeFile.ToLowerInvariant())) {
                Add-Issue $hard 'unlisted_asset' $relativeFile 'File is inside a formal asset root but absent from the manifest.'
            }
            if (-not (Test-Path -LiteralPath ($file.FullName + '.meta') -PathType Leaf)) {
                Add-Issue $hard 'meta_missing' $relativeFile 'Unity-managed file has no meta file.'
            }
            if ($file.BaseName -match '(?i)(placeholder|graybox|greybox|capsule|cube|sphere|cylinder|temporary|temp)') {
                Add-Issue $advisory 'placeholder_name' $relativeFile 'Name suggests placeholder or primitive content; prove it is not a visible product fallback.'
            }
            if ($file.Extension -match '(?i)^\.(unity|prefab|asset)$') {
                $text = Get-Content -Raw -LiteralPath $file.FullName
                if ($text -match 'm_Script:\s*\{fileID:\s*0\s*\}') {
                    Add-Issue $hard 'missing_script' $relativeFile 'Serialized object contains a null MonoBehaviour script reference.'
                }
            }
        }
    }
}

foreach ($metaEntry in $allMetaFiles) {
    $assetPath = $metaEntry.file.FullName.Substring(0, $metaEntry.file.FullName.Length - 5)
    if (-not (Test-Path -LiteralPath $assetPath)) {
        Add-Issue $hard 'orphan_meta' $metaEntry.path 'Meta file has no matching asset or directory.'
    }
}

$guidOwners = @{}
foreach ($metaEntry in $allMetaFiles) {
    $guid = Get-MetaGuid $metaEntry.file.FullName
    if ($null -eq $guid) {
        Add-Issue $hard 'meta_guid_invalid' $metaEntry.path 'Meta GUID is missing or malformed.'
        continue
    }
    if ($guidOwners.ContainsKey($guid)) {
        Add-Issue $hard 'duplicate_guid' $metaEntry.path "GUID $guid is already owned by $($guidOwners[$guid])."
    } else {
        $guidOwners[$guid] = $metaEntry.path
    }
}

$caseOwners = @{}
foreach ($entry in $allManagedFiles) {
    $caseKey = $entry.path.ToLowerInvariant()
    if ($caseOwners.ContainsKey($caseKey) -and $caseOwners[$caseKey] -cne $entry.path) {
        Add-Issue $hard 'case_collision' $entry.path "Path collides by case with $($caseOwners[$caseKey])."
    } else {
        $caseOwners[$caseKey] = $entry.path
    }
}

$status = if ($hard.Count -eq 0) { 'PASS' } else { 'FAIL' }
$assetArray = $assetResults.ToArray()
$hardArray = $hard.ToArray()
$advisoryArray = $advisory.ToArray()
$report = [ordered]@{
    schemaVersion = 1
    gate = 'unity-asset-structural-integrity'
    status = $status
    note = 'This result covers structural file facts only. Runtime, visual, provenance review, and device gates remain separate.'
    generatedUtc = [DateTime]::UtcNow.ToString('o')
    projectRoot = $project
    manifestPath = $manifestFile
    counts = [ordered]@{
        manifestAssets = $manifestAssets.Count
        scannedFiles = $allManagedFiles.Count
        scannedMetaFiles = $allMetaFiles.Count
        hardIssues = $hard.Count
        advisories = $advisory.Count
    }
    assets = $assetArray
    hardIssues = $hardArray
    advisories = $advisoryArray
}

$json = $report | ConvertTo-Json -Depth 8
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $json
} else {
    $outputFull = [System.IO.Path]::GetFullPath($OutputPath)
    $outputDirectory = Split-Path -Parent $outputFull
    if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
        New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
    }
    [System.IO.File]::WriteAllText($outputFull, $json, [System.Text.UTF8Encoding]::new($false))
    Write-Output $outputFull
}

if ($hard.Count -gt 0) {
    exit 2
}

exit 0
