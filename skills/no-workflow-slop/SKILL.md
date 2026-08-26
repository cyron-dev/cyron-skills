---
name: no-workflow-slop
description: Use when implementing, testing, releasing, handing off, or reviewing a multi-step workflow where local success could hide a broken end-to-end transition, skipped gate, stale verification, missing owner, unsafe retry, incomplete rollback, or false terminal state.
---

# No Workflow Slop

## Core rule

A workflow is correct only when the real actor can move from the declared start state to the terminal state through every required transition. Helper success does not prove the journey.

## Map the workflow before acting

```text
Actor and goal:
Start state and prerequisites:
Ordered transitions:
Entry and exit condition for each transition:
External side effects:
Failure, retry, cancel, and rollback paths:
Terminal states and exact claims allowed:
Evidence captured at each gate:
Handoff owner and next action:
```

If a transition changes data, money, access, deployment, or external state, identify its recovery path before executing it.

## Gate rule

For each gate, record **artifact -> action -> fresh evidence -> decision**.

- Evidence must belong to the exact artifact entering the next gate.
- A check run before the latest relevant change is stale.
- A unit/helper test cannot substitute for browser, API, database, or integration evidence when the workflow crosses those boundaries.
- A successful build proves buildability, not runtime behavior.
- Deployment is not completion; post-deploy verification is another gate.
- Skipped required gates keep the workflow incomplete, even when authorized. Record who accepted the risk.

## State-transition audit

Verify the real sequence, not isolated endpoints:

- Start -> first action uses the correct default state.
- Apply/change -> every dependent output switches together.
- Repeated action is safe or explicitly rejected.
- Reset/cancel returns to the stated state and clears the correct persisted inputs.
- Refresh/deep link restores one coherent state.
- Failure does not silently advance the workflow.
- Retry does not duplicate side effects.
- Terminal status matches what actually happened: completed, not released, rolled back, or blocked.

## Handoff contract

A handoff includes exact artifact/version, current state, evidence with timestamps, known failures, skipped checks, irreversible actions, rollback procedure, next action, and named owner. "Someone should verify later" is not a handoff.

## Rationalization check

| Excuse | Reality |
|---|---|
| "The helper tests pass" | They may fabricate missing integration state. |
| "Smoke passed yesterday" | It predates the current artifact. |
| "We can verify after release" | Verification is part of release. |
| "The happy path works" | Reset, retry, failure, and deep link are workflow paths. |
| "The window is closing" | Time pressure does not make stale evidence current. |

## Completion proof

Report: **workflow map -> gates executed -> evidence per gate -> skipped/failed gates -> resulting terminal state -> handoff/rollback**. Claim completion only when the real end-to-end path and required recovery path are proven on the current artifact.
