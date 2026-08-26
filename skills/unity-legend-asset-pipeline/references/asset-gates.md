# Asset gates

## Contents

1. Universal gates
2. Character and monster gates
3. Portal and interactable gates
4. Scene gates
5. Animation and VFX gates
6. Material and texture gates
7. Prefab and architecture gates
8. Mobile and performance gates
9. Failure rules

## Universal gates

| Gate | Required facts | FAIL examples |
|---|---|---|
| Scope | Stable ID, current acceptance ID, formal consumer, owner | Asset has no current E0/V1 use |
| Provenance | Source record, license, author/generator, original hash | Unknown source or license |
| Integrity | Path, `.meta`, unique GUID, dependency closure, file hash | Missing meta, duplicate GUID, broken reference |
| Import | Type-specific importer settings and target overrides | Wrong alpha, color space, compression, pivot, scale |
| Runtime | Formal Boot path, unique owner, correct enabled state | Works only in a test scene or installer preview |
| Visual | Fixed views, current asset hashes, object identity, human verdict | Screenshot predates asset or cannot identify the object |
| Device | Target build, device/GPU, memory and frame evidence when required | Editor-only evidence used for an Android claim |

Do not average gates. One required failure fails the asset.

## Character and monster gates

- Record the approved class, level, equipment state, silhouette, scale, foot point, sorting, shadow, hit volume, and camera-facing rule.
- Inventory every required action and direction. Compare expected and observed frame counts, order, duration, pivot, bounds, and contact point.
- Require one visible formal presentation owner. Disable or remove visible Capsule, Cube, primitive body, debug weapon, and fallback Renderer objects.
- Prove the formal Prefab is self-contained unless the approved composition contract names each injected dependency. A Scene override cannot silently repair an empty production Prefab.
- Exercise idle, movement, attack, skill, hit, death, spawn, disable, reload, and pooling paths that are in scope.
- Capture alpha edges over light and dark backgrounds. Reject chroma spill, halos, cropped weapons, foot sliding, and direction mismatch.

## Portal and interactable gates

- Separate visible frame/core/VFX from trigger, blocker, navigation, label, and policy objects.
- Bind each visible pixel group to an exact Renderer and material. Use an Object ID or picking pass when several objects overlap.
- Reject a visible Collider proxy, Capsule, Cylinder, gray shell, opaque protection layer, test RingMesh, or unapproved fallback material.
- Record portal ID, display name, source region, open/sealed state, reason, destination region/spawn, position, rotation, dimensions, and interaction policy.
- Test approach, leave, confirm, sealed denial, repeated confirm, loading failure, recovery, and return journey when in scope.
- Verify transparent edges, depth order, intersection, walk-through clearance, navigation, camera obstruction, and name readability.

## Scene gates

- Load through formal Boot and Build Settings, not by opening the destination Scene alone.
- Check unique product root, player, camera, HUD, services, region scope, spawn, portal set, lighting, colliders, navigation, boundaries, and unload behavior.
- Capture every approved fixed view plus any defect view. Reject voids, exposed world edges, graybox objects, fallback materials, severe underexposure, and missing product actors.
- Compare source and destination transforms when an installer derives content. Test paired drift, wrong type, missing source, write failure, rollback, cleanup, and second-build byte stability.
- Preserve Scene and meta GUIDs across authorized rebuilds unless the plan explicitly changes identity.

## Animation and VFX gates

- Record clip/frame identity, authored order, loop mode, transitions, events, duration, and interruption rules.
- Test real input or state changes, not direct presenter calls alone.
- Validate sorting, camera relation, pooling reset, disabled state, duplicate emission, bounds, and cleanup.
- Reject VFX that hides placeholders, clips through the camera, remains after unload, or changes gameplay ownership.

## Material and texture gates

- Record source dimensions, alpha mode, color space, texture type, sprite mode, pivot, PPU, wrap, filter, mipmap, compression, max size, and platform override.
- Record shader, render queue, blend/depth state, texture slots, emission, instancing, and material ownership.
- Reject pink shaders, missing textures, opaque alpha backgrounds, gray matte edges, incorrect normals, unintended material instances, and unsupported platform formats.
- Compare light/dark backgrounds and the target device. Editor thumbnails are not evidence.

## Prefab and architecture gates

- Name the current runtime owner and lifecycle for every new component.
- Require one current consumer and one failing test before adding an interface, installer, registry, manager, or adapter.
- Reject duplicate importers, asset databases, generic managers, hidden service locators, and future-version scaffolds.
- Keep source asset, runtime instance, presentation state, and persistence data separate.
- Validate exact component counts, serialized references, active state, child identity, and dependency paths.

## Mobile and performance gates

- Record device, OS, GPU, resolution, quality level, build hash, and graphics API.
- Measure cold load, warm load, peak memory, steady memory, frame time, draw calls, batches, overdraw, texture memory, and shader compilation relevant to the asset.
- Check safe area, aspect ratios, transparency, thermal behavior, background/resume, and a sustained run when required by the plan.
- A desktop Editor run cannot pass an Android production gate.

## Failure rules

- `PASS`: every required fact and evidence exists and matches the current bytes.
- `FAIL`: an observed result violates an approved contract.
- `BLOCKED`: a required source, license, tool, build module, formal scene, or device is unavailable.
- `NOT RUN`: the gate has no current execution evidence.

Never convert `BLOCKED` or `NOT RUN` to PASS. Never use a later screenshot with an earlier hash, or a later asset with an earlier screenshot.

