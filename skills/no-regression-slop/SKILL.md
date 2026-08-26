---
name: no-regression-slop
description: Use when fixing bugs, refactoring, changing shared state, or reviewing a patch where behavior that already works could regress; triggers include "was working before", green new tests with a broken user flow, changed defaults, widened date/state logic, and unrelated behavior altered by a fix.
---

# No Regression Slop

## Core rule

Change the broken behavior and freeze the behavior that is already correct.

Before editing production code, write this preservation contract:

```text
Requested change:
Broken behavior and evidence:
Correct behavior that must remain unchanged:
Files and flows allowed to change:
Proof required before completion:
```

If the correct behavior cannot be named or observed, inspect the existing flow before editing.

## Required workflow

1. Reproduce the requested bug.
2. Capture the current correct behavior at the same boundary: UI, API, output, state, or data.
3. Add a failing test for the bug and a characterization test for every nearby correct behavior at risk.
4. Make the smallest production change that fixes the failing case.
5. Run the focused tests, broader relevant tests, and the real user flow.
6. Compare before and after. A new test suite being green is not proof if the old behavior was never asserted.

When a regression is found, restore the correct behavior. Do not defend an unrelated redesign because time was spent on it.

## Review contract

Report four concrete items:

- **Changed:** only the requested behavior.
- **Preserved:** named defaults, flows, outputs, and data that stayed the same.
- **Evidence:** commands, assertions, screenshots, or before/after values.
- **Unverified:** anything not directly checked.

## Red flags

- Reusing one state variable for concepts with different meanings.
- Replacing a correct default while fixing an optional filter.
- Treating newly green tests as permission to change untested behavior.
- "The refactor is cleaner" without a user requirement.
- "It is close enough" when the original user flow changed.
- Fixing the symptom in several layers instead of the source.

## Pressure checks

| Rationalization | Required response |
|---|---|
| "The shared rewrite is easier." | Preserve the working branch; isolate the requested change. |
| "All new tests pass." | Add proof for the old correct behavior. |
| "We already spent hours on this." | Time spent does not make a regression acceptable. |
| "The user can use Reset." | Default behavior must work without a workaround. |
| "This is a better design." | Do not ship product changes the user did not request. |

## Example

For a Dashboard where Today is correct and From/To is broken:

- Freeze: opening the Dashboard shows Today; Reset returns to Today.
- Change: only explicit From/To switches the view to a range.
- Test: default load, explicit range, and Reset as three separate behaviors.
- Reject: initializing the default view from stale range parameters.
