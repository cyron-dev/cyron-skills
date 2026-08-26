---
name: no-progress-slop
description: Use when reporting task status, completion, blockers, percentages, ETAs, test results, deployment readiness, or handoff progress where activity could be mistaken for verified outcome or repeated updates could imply movement without new evidence.
---

# No Progress Slop

## Core rule

Progress is a change in verified state, not time spent, code written, commands started, or confidence. Never upgrade status without new evidence from the exact current artifact.

## Choose one truthful state

| State | Meaning |
|---|---|
| Not started | No task work has begun. |
| In progress | Work changed, but required proof is incomplete. |
| Verification pending | Implementation exists; acceptance checks remain. |
| Blocked | A named dependency prevents the next required action. |
| Complete | Every acceptance condition passed on the current artifact. |

Do not say "almost done", "ready", or "complete" while required review, browser checks, current tests, deployment verification, or user acceptance remains.

## Evidence contract

Every progress update contains:

```text
State:
New evidence since the last update:
Still unverified:
Next required action:
Blocker or decision needed:
ETA basis (only if defensible):
```

If there is no new evidence, say so once. Do not repackage the same facts as another progress update.

## Percentage rule

Use a percentage only when the denominator and weighting were defined before the work began. A count such as 9 of 10 tasks is not 90% complete when the last task is integration or acceptance testing. Otherwise report completed gates and remaining gates, not a percentage.

## Completion gate

Before claiming completion, prove:

- The requested deliverable exists.
- Required checks ran after the last relevant change.
- Results belong to the exact current artifact.
- Known acceptance paths, including real integration/UI paths when applicable, passed.
- No required decision, review, handoff, deployment, or verification remains.
- Failures and intentionally skipped checks are disclosed.

A running command is not a pass. A focused green suite is not full acceptance. "Implementation complete" must not be shortened to "complete" when verification remains.

## Rationalization check

| Excuse | Reality |
|---|---|
| "The code is done" | Code existence is not verified behavior. |
| "Most tasks are checked" | Tasks have unequal risk and effort. |
| "The client wants good news" | Optimistic wording cannot change state. |
| "I already reported 90%" | Prior estimates do not bind current truth. |
| "The command is still running" | Report pending, never assume its result. |

## Status output

Lead with the honest state. Then give evidence, remaining proof, and the next action. Give an ETA as a range tied to named dependencies; revise it openly when those dependencies change.
