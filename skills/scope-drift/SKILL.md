---
name: scope-drift
description: Use when planning, implementing, debugging, or reviewing work where the solution could expand beyond the user's requested outcome; triggers include "while I'm here", adjacent improvements, redesigns, extra files or systems, new product behavior, broad refactors, and discoveries that need separate approval.
---

# Scope Drift

## Core rule

Inspect broadly when needed. Change only what the user authorized.

Before making changes, write this scope contract:

```text
Requested outcome:
In-scope behavior and systems:
Allowed enabling work:
Explicitly out of scope:
Actions that need new approval:
```

## Classify every proposed action

| Class | Meaning | Action |
|---|---|---|
| Required | Directly produces the requested outcome | Do it. |
| Enabling | Necessary for required work to function or be verified | Do the minimum. |
| Adjacent | Useful but not necessary | Report it; do not implement. |
| Different product decision | Changes defaults, rules, UX, data meaning, or ownership | Stop and ask. |

Every changed file and behavior must map to **Required** or **Enabling**. If the mapping needs a long argument, it is probably out of scope.

## Required workflow

1. Restate the requested outcome in observable terms.
2. Identify the narrowest mutation boundary: files, database, services, accounts, and people.
3. Investigate enough to find the root cause. Read-only investigation may be wider than the mutation boundary.
4. Separate necessary work from discoveries.
5. Implement only required and minimal enabling work.
6. Review the final diff or action log. Remove changes that cannot be traced to the scope contract.
7. Report adjacent findings as follow-up options without presenting them as completed work.

When the user changes the request, update the scope contract before continuing.

## Approval boundary

Get new direction before:

- changing a correct default or business rule;
- modifying unrelated modules, databases, deployments, or accounts;
- sending, publishing, deleting, migrating, or granting access beyond the request;
- turning a bug fix into a redesign;
- repairing pre-existing failures that do not block the requested outcome.

## Red flags

- "While I'm here, I can clean this up."
- "This architecture would be better."
- "The user will probably want this too."
- Editing a nearby file because it is convenient.
- Expanding acceptance criteria after implementation starts.
- Using a discovered bug as permission to fix it.
- Treating read access as permission to mutate.

## Pressure checks

| Rationalization | Required response |
|---|---|
| "It is only one extra line." | Size does not create authorization. |
| "The full suite already fails here." | Report the pre-existing failure unless it blocks the requested work. |
| "The redesign avoids future work." | Ask before changing product behavior or architecture. |
| "I found another bug." | Record evidence and keep it separate. |
| "It is safer to change both systems." | Prove both are necessary or keep the second untouched. |

## Example

Request: fix Dashboard calculations.

- Required: correct the confirmed calculations and their tests.
- Enabling: add focused regression coverage and build the frontend.
- Adjacent: repair an unrelated migration drift.
- Different product decision: replace the correct default Today view with a date-range default.

The adjacent migration is reported. The Today default stays unchanged unless the user explicitly asks to change it.
