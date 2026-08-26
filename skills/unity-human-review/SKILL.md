---
name: unity-human-review
description: Use when a Unity scene, Game view, PlayMode journey, prefab, installer output, GUID, Build Settings entry, or visual capture needs human review with feedback traceable to runtime or serialized evidence.
---

# Unity Human Review

Turn Unity evidence into a review page, then use `human-review` to collect edits and comments. The page is the annotation surface; it does not control Unity or prove facts that were never captured.

**REQUIRED SUB-SKILL:** Use `human-review` for the open, poll, apply, and acknowledge loop.

## Choose the evidence packet

| Review target | Required evidence | Stable locator |
|---|---|---|
| Scene or Game view | Original-resolution capture, camera state, scene and object mapping when available | scene GUID + GlobalObjectId + component/material GUID |
| PlayMode defect | Key frame, run ID, frame/time, test case, log range, runtime snapshot | run ID + frame + monotonic time + runtime/prefab identity |
| Scene/prefab change | Both assets and metas, SHA-256, parsed object/dependency diff, Build Settings | asset GUID + fileID + component + property path |

If the required evidence is missing, label the review as visual-only or approximate. Never infer an exact Unity object from RGB pixels alone. Never treat similar screenshots as proof that serialized assets are equivalent.

## Build the page

1. Keep review output outside `Assets`, `Packages`, and `ProjectSettings`. Prefer `Artifacts/Reviews/<run-id>` or a temporary directory.
2. Create a manifest following [references/manifest-schema.md](references/manifest-schema.md). Use one evidence item per camera, key frame, or structural finding.
3. Generate a self-contained page:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/New-UnityReviewPage.ps1 `
     -ManifestPath C:\path\review.json `
     -OutputPath C:\path\review.html
   ```

   The generator verifies referenced files and any declared SHA-256 values. Image grids provide coarse region comments such as `H-Spawn | region C4`; they are not pixel bounding boxes.
4. Open and poll with `human-review`:

   ```powershell
   npx -y human-review C:\path\review.html
   npx -y human-review poll C:\path\review.html --timeout 600
   ```

## Apply feedback

- Preserve every returned `edit.after` verbatim in the report or manifest source.
- Map each comment by its evidence ID and stable locator. A grid-cell comment stays approximate unless the same capture has an Object-ID or picking map.
- Change Unity source through the Editor, an installer, or a verified serialization tool. Do not paste review text into `.unity`, `.prefab`, or `.meta` YAML.
- Re-capture changed evidence under a new run ID. Do not overwrite the reviewed packet.
- Acknowledge only after all feedback in the batch has been applied:

  ```powershell
  npx -y human-review poll C:\path\review.html --ack --timeout 600
  ```

## Review gates

- Visual verdicts cover composition, readability, clipping, occlusion, framing, and presentation visible in the supplied capture.
- Runtime verdicts require a shared clock between frame, state snapshot, XML, and log. A test-level duration alone is not a frame timestamp.
- Structural verdicts require hashes and parsed Unity identities. Screenshots are supporting evidence only.
- Runtime `instanceID` is valid only within its run ID. Hierarchy paths are readable labels, not stable identity.
- Missing mappings remain `unresolved`; do not guess an object, material, owner, or GUID.

## Common mistakes

- Opening a `.unity` file directly in `human-review`: this reviews YAML text, not the scene.
- Capturing after the failure without a shared timestamp: the frame cannot be tied to state or log evidence.
- Editing generated HTML only: the next generation discards the change. Apply edits to the manifest or report source.
- Calling a grid cell a precise selection: it is only a coarse region.
- Writing directly into serialized Unity YAML from review feedback: use the producing installer or Unity Editor path instead.
