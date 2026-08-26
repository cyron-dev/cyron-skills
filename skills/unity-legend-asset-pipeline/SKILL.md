---
name: unity-legend-asset-pipeline
description: Use when producing, importing, repairing, auditing, or approving Unity assets for a legendary-game product, especially characters, portals, scenes, monsters, animation, VFX, materials, prefabs, gray shells, visible placeholders, broken references, mobile budgets, or asset evidence.
---

# Unity Legendary Asset Pipeline

## Core rule

Call an asset product-ready only after provenance, structure, runtime, visual, and target-device gates pass. Automation may prove file facts. It cannot approve art direction or a player journey.

## Required companions

- **REQUIRED:** Use `superpowers:test-driven-development` before changing an asset contract, importer, installer, prefab, or scene.
- **REQUIRED:** Use `unity-human-review` for Scene, Prefab, Game view, capture, GUID, and Build Settings review.
- Use `imagegen` or `creative-production:produce` only for requested raster creation or editing.
- Use `human-review` when the user must comment on captures.
- Use `superpowers:verification-before-completion` before any PASS claim.

## Load references

Read [asset-gates.md](references/asset-gates.md) and [evidence-contract.md](references/evidence-contract.md) for every approval. Use [manifest.example.json](references/manifest.example.json) as the asset-manifest shape.

## Workflow

1. Resolve the approved product scope, source/license record, target platform, Unity version, formal scene, and player journey. Mark missing authority `BLOCKED`.
2. Create or update one manifest row per formal asset and dependency. Record stable ID, path, role, provenance, acceptance ID, GUID, and SHA-256.
3. Write an authentic failing test for the defect or missing contract. Preserve the failed evidence.
4. Make the smallest current-scope asset or installer change. Do not add a future-facing layer.
5. Run `scripts/audit-unity-asset-integrity.ps1` with the project root and manifest. Treat its PASS as structural only.
6. Run focused EditMode/PlayMode tests, then affected regressions. Use unique XML, logs, launcher records, process exits, and hashes.
7. Capture the formal Boot journey and fixed review views. Bind pixels to objects with a hierarchy record, Object ID/picking pass, or exact serialized identity.
8. Test the target device when the gate covers compression, memory, thermal load, safe area, transparency, or performance.
9. Obtain independent visual review. Close only when every required gate is `PASS` and open exceptions are zero.

## Three anti-slop gates

- **Architecture:** Every new type has a current consumer, owner, lifetime, failing test, and removal condition. Reject empty interfaces, generic managers, duplicate pipelines, service locators, and V2+ scaffolds.
- **Product:** A formal asset appears through the real Boot journey and performs its approved job. Reject visible primitives, capsules, gray protection shells, scene-only repairs of empty prefabs, test-only composition, and decorative work without a current acceptance ID.
- **Writing:** Report paths, objects, measurements, failures, and evidence. Remove claims such as “complete,” “immersive,” or “production quality” when no gate proves them.

## Status contract

Use only `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`. One required failed gate makes the asset `FAIL`. Missing tools, licenses, source files, formal scenes, or target devices make the relevant gate `BLOCKED`, never PASS.

## Output

Return the manifest delta, gate table, exact failures, evidence links and hashes, frozen-boundary check, and next authorized action. State what was not inspected.
