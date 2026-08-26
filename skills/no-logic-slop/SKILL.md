---
name: no-logic-slop
description: Use when product or application logic may contain contradictory states, mixed date or filter scopes, KPI/card mismatches, misleading labels, representative-record aggregation, invalid fallbacks, or green tests that do not prove the stated business rule.
---

# No Logic Slop

## Core rule

Make every result follow one explicit product rule: one concept has one meaning, and one scope produces one consistent result set.

## Write the logic contract first

Before editing production code, state:

```text
Product rule:
Independent inputs and their meanings:
State transition caused by each user action:
Scope used by each output:
Invariants that must always agree:
Valid zero/empty/error behavior:
Evidence that will prove the rule:
```

If the rule is ambiguous, stop and ask. Do not invent one.

## Required audit

1. Separate concepts. Real today, snapshot date, and range boundaries require distinct state.
2. Trace KPIs, cards, filters, and labels to the normalized fact set. Peers must use the declared scope.
3. Define transitions explicitly. Example: initial load shows Today; applying From/To switches to Range; reset returns to Today.
4. Calculate per record, then sum. Never use a representative row for an aggregate.
5. Make labels describe the actual value and time scope.
6. Preserve valid zero and empty states. Do not use `a || b` when `0`, `false`, or an empty collection is meaningful.
7. Test the business rule and user transition, not merely a helper or fixture.

## Contradiction audit

Before declaring success, answer:

- Can a label and value describe different dates or scopes?
- Can a filter change one aggregate while peer aggregates remain on another scope?
- Can a KPI filter produce zero visible cards while the KPI still reports a nonzero count?
- Can mixed states disagree across KPI, card, and filter?
- Can multiple records be calculated using only the first or last record?
- Can a fallback replace a legitimate zero with an unrelated number?
- Does the test fail when the product rule is deliberately broken?

Any "yes" is a logic defect, even when the suite is green.

## Example

Rule: "Show today's data by default; use range data only after From/To is applied."

Keep `currentDate`, `snapshotDate`, and `range` independent. Today reads `currentDate`; applying From/To changes mode to Range and all range outputs share it. Do not mutate `today` to hold a snapshot or range boundary.

## Rationalization check

| Excuse | Reality |
|---|---|
| "Tests are green" | Coverage is not logical consistency. |
| "Fallback avoids showing zero" | Zero may be correct. |
| "The last row represents the employee" | Aggregates require per-record rules. |
| "One date variable is simpler" | Distinct concepts require distinct state. |
| "Only this KPI needs the filter" | That requires an explicit rule, not an accident. |

## Review output

Report each issue as: **Rule -> counterexample -> root cause -> smallest correct fix -> proof**. Reject patches that only satisfy the fixture while leaving the contradiction possible.
