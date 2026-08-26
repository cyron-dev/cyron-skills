# Evidence contract

## Contents

1. Run identity
2. Required artifacts
3. Visual identity
4. Manifest and dependency closure
5. Review table
6. Closure rules

## Run identity

Assign one unique stem to each attempt. Never overwrite a prior XML, log, launcher record, screenshot, manifest, or review page. Record:

- command and working directory
- Unity executable and project version
- UTC/local start and end time
- pre-run and post-run Unity process count
- observed main and worker process IDs
- outer process and Unity exit codes
- test filter, platform, discovered/pass/fail/skip/inconclusive counts
- SHA-256 for every artifact
- bad-marker scan result

Keep failed and launcher-only attempts. Label replacements and successor stems.

## Required artifacts

| Claim | Minimum evidence |
|---|---|
| File integrity | manifest, path, GUID, file/meta hashes, dependency closure |
| Import correctness | serialized importer settings and target override |
| Prefab correctness | component/reference inventory plus focused test |
| Scene correctness | formal Scene identity, Build Settings, focused test |
| Runtime behavior | formal Boot journey, XML, full log, exits |
| Visual correctness | original-resolution captures, camera state, object identity, human verdict |
| Device correctness | build hash, device/GPU/OS, capture and measurements |
| Closure | independent spec and quality/visual reviews |

Do not cite a summary table as raw evidence. Reparse XML and logs from disk before final review.

## Visual identity

A screenshot proves pixels, not object ownership. Bind it to the Scene and object with at least one of:

1. Object ID or picking pass paired with the color capture.
2. GlobalObjectId/hierarchy path and a capture tool that logs the rendered object set.
3. Exact serialized identity plus an isolated capture where no other object can produce the pixels.

Record camera transform, projection, resolution, graphics API, quality level, Scene GUID, asset hashes, frame or monotonic time, and capture method. A Scene-view composition capture does not prove a PlayMode journey.

## Manifest and dependency closure

Each row must include:

- `id`: permanent product ID, not a filename-derived identity
- `path`: project-relative Unity path
- `role`: character, monster, portal, scene, texture, material, VFX, animation, prefab, audio, UI, or support
- `provenance`: license/source record or generated-asset record
- `acceptanceId`: current approved requirement
- `expectedGuid` and `expectedSha256` once frozen
- direct dependency IDs or an attached Unity dependency export
- gate states and evidence stems

List every file under each declared formal asset root. An unlisted file is not approved by association.

## Review table

Use one row per gate:

| Asset ID | Gate | State | Expected | Observed | Evidence | Reviewer |
|---|---|---|---|---|---|---|

Write exact objects and values. Avoid “looks good,” “complete,” “polished,” “immersive,” and “production-ready” without the row-level facts.

## Closure rules

- Current asset and meta hashes must match the reviewed evidence.
- Formal journey evidence must postdate the reviewed bytes.
- All required rows must be PASS; open exceptions must be zero.
- Independent reviewers must not rely only on the implementer report.
- State every uninspected category. Absence of evidence is `NOT RUN` or `BLOCKED`.

