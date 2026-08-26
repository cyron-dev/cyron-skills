---
name: no-business-slop
description: Use when requirements, KPI definitions, permissions, financial treatment, statuses, date semantics, exception handling, or acceptance criteria are incomplete and an implementation could silently invent business policy or present assumptions as confirmed rules.
---

# No Business Slop

## Core rule

Implementation may resolve technical details; it may not invent business policy. Separate confirmed rules, derived facts, reversible assumptions, and decisions that require the business owner.

## Build the rule ledger

Before changing behavior, record:

| Item | Status | Source | Consequence if wrong |
|---|---|---|---|
| Exact user statement | Confirmed | User/spec/data contract | Implement and test |
| Necessary logical consequence | Derived | Named confirmed rule | Show derivation |
| Reversible low-impact choice | Assumption | None | Label and isolate |
| Money, people, safety, access, compliance, KPI, or workflow policy | Decision required | Business owner | Stop before encoding |

Silence is not approval. Existing code is evidence of current behavior, not proof that behavior is the intended business rule.

## Decision boundary

Stop and request a decision when two plausible choices change any of these:

- Who or what is counted, paid, billed, scheduled, visible, or allowed.
- Whether categories overlap or are mutually exclusive.
- The meaning of Today, a snapshot, a range, a status, or Reset.
- Which filters affect which KPIs, cards, reports, or exports.
- How missing, zero, future, invalid, or conflicting records are treated.
- Acceptance criteria or release outcome.

Do not hide a business choice inside a fallback, variable name, SQL condition, aggregation order, UI label, or test fixture.

## Required contract

For every behavior under change, state:

```text
Confirmed rule and source:
Inputs and business meanings:
Outputs and calculation scope:
Edge cases explicitly decided:
Open decisions and their impact:
Reversible assumptions, if any:
Tests that prove only the confirmed rule:
```

If an open decision blocks correctness, pause that behavior. Continue only with independent work that does not encode the missing policy.

## Assumption rule

An assumption is allowed only when it is reversible, low-impact, clearly disclosed before implementation, and cannot affect money, access, safety, compliance, staffing, or reported KPIs. Put it behind a named boundary so it can be replaced without rewriting unrelated logic.

## Rationalization check

| Excuse | Reality |
|---|---|
| "The manager said fill in the gaps" | Authority cannot supply missing domain intent. |
| "This is the common convention" | Convention is not this business's policy. |
| "The old code does it" | Legacy behavior still needs confirmation. |
| "We can change it later" | Wrong metrics and money can cause irreversible decisions. |
| "Tests pass" | Tests can faithfully encode an invented rule. |

## Review output

Report: **confirmed rule -> source -> implementation mapping -> uncovered edge -> decision needed -> safe work that can continue**. Never present a provisional choice as a product requirement.
