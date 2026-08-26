---
name: no-product-scope-slop
description: Use when reviewing a product artifact or implementation handoff that contains proposed or implied screens, navigation, roles, workflows, visible states, data behavior, management functions, or release commitments and must be checked against an authority manifest or decision register.
---

# No Product Scope Slop

## Core principle

Treat current authority artifacts as the only source of implementation authorization. Inventory first, preserve source authority exactly, and never convert plausibility, pressure, or silence into a product decision.

## Require the review inputs

Require all of the following before accepting a handoff:

- The artifact being reviewed.
- The exact review target and claimed readiness state.
- The current authority manifest, including its identifier and SHA-256.
- The current user decision register.
- The source-authority baseline.
- The current open-decision queue.
- The task's declared AI model and review level.
- Any fresh execution, render, test, or inspection evidence relevant to the claim.

Validate that authority identifiers and hashes match the review target. If required authority evidence is missing, stale, ambiguous, or mismatched, stop the handoff with `DECISION_REQUIRED` or `REJECT`. Continue only the portions of the audit supported by available evidence, record unsupported fields as `null`, classify them `UNKNOWN`, and list the exact evidence required. Never guess.

Before writing any rule ID, decision ID, or `decision_reference`, find that identifier literally in the validated authority manifest, decision register, or open-decision queue. Do not infer omitted IDs, expand or synthesize numeric ranges, cite a range unless that range appears literally, or present a rule ID as a decision, owner, or decision gate. Use rule IDs only as authority evidence. If no existing decision or named gate is evidenced, route to a named owner found in the validated inputs and write `new decision required (no ID assigned)`; require the new decision explicitly and never fabricate its ID.

## Inventory before judgment

Inventory every proposed or implied product element before assigning any disposition. Include every:

- screen, navigation item, component, and action;
- role, permission, workflow, business process, and management function;
- user-visible state and data behavior;
- device policy, release gate, backlog commitment, and other release commitment.

Treat both inclusion and exclusion as product-scope decisions. Inventory removals, omissions, and narrowed applicability when the artifact proposes them. Do not silently remove an authorized responsibility because another role or release segment is prioritized.

Before any authority lookup, complete this deterministic source-span coverage pass:

1. Number every content-bearing artifact sentence, clause, and list item. Give each an immutable source-span ID, record its exact source span or location, and assign immutable proposition IDs. Mark a span non-propositional only with an explicit reason; do not create useless propositions or rows for punctuation or purely grammatical fragments.
2. Freeze product identity, formal name, user-facing name, objective, and every other naming or identity claim as first-class propositions when present.
3. Expand coordination and shared predicates. Give every separately named entity, role, source, method, option, and directive joined by `and` or `or` each applicable shared predicate. When the artifact separately requests or asserts them, split role or persona existence, role definition, permissions, inclusion, release treatment, timing, and scope into separate propositions.
4. Split conditions and independent modifiers. Give `where`, `when`, `unless`, `if`, silence or absence conditions, exceptions, finality, buildability, immediacy, mandatory status, and similar independent authorization or delivery effects their own propositions whenever they change the claimed authority or required outcome.
5. Create a source-span coverage matrix that maps every numbered span to one or more atomic proposition IDs and every proposition ID to exactly one ledger row. Do not start authority lookup until there are zero uncovered content-bearing spans and zero proposition IDs without exactly one row mapping.

Before any authority lookup, atomize and freeze every explicit artifact proposition and necessary implication, with its exact artifact location. Include as first-class propositions every separately named authorization source or method, gap-filling instruction, decision-authority override, instruction to suppress unknowns, TBDs, questions, or gates, inclusion or exclusion instruction, and readiness or build label. Freeze separately named sources, methods, directives, options, and propositions as separate elements even when they will share a class, evidence, route, or disposition. Authority text may classify, conflict with, or route a frozen element, but must never add an element to the artifact inventory.

After freezing the artifact inventory, atomize each candidate Manifest rule into authority-bearing propositions. Represent each artifact and authority proposition by its subject, predicate or property, polarity, and extent; all four must match before transferring a state. Then reduce the inventory to atomic elements actually present in or necessarily implied by the artifact:

1. Match an artifact element to a Manifest row only when it is the same named element and the rule applies to the same extent. Lexical similarity, synonymy, a shared topic, or a related conflict is not identity. For example, do not treat `saved work` as `Saved Insights` or an `evidence panel` as an Activity Drawer or Sources element.
2. Give each row one actual proposed or implied element and exactly one unchanged `source_authority_state`. Split a mixed proposition until locked responsibility, conditional design work, and open release inclusion or depth each occupy their own row.
3. Expand category buckets such as `screen set`, `action catalogue`, `workflow catalogue`, `management functions`, `other states`, or combined jobs/questions/sources/permissions into the distinct elements the artifact actually proposes or necessarily implies. Do not leave a bucket in place of known members.
4. Do not invent concrete routes, screens, states, exclusions, runtime topology, or backlog candidates to complete or reject a requested set. When the artifact requests an exact set but supplies no concrete members, inventory that generic request itself as one unmatched `null` / `UNKNOWN` element and route it for decision.

For every frozen element, search all authority-bearing propositions for a dedicated exact subject, predicate or property, polarity, and extent match before assigning `null`. Preserve the state of a dedicated exact state-bearing proposition. If only related authority exists, keep `source_authority_state: null` and cite that authority only as related evidence or conflict; related authority never donates its state.

Treat a positive clause, prohibition, open or unresolved qualifier, `not decided` qualifier, exclusion, condition, and carve-out as separate propositions. A Manifest row's state does not automatically apply to every clause or noun mentioned in its rule text. Transfer `source_authority_state` only from the exact matching proposition. When a property appears only in an open, unresolved, `not decided`, excluded, conditional, or carve-out proposition, do not inherit the containing row's `LOCKED` state: use a dedicated exact state-bearing Manifest row if one exists; otherwise record `null` and retain the mixed rule only as related evidence.

Separate behavior prohibited by an exact rule from unresolved possible behavior, including possible read-only behavior. Apply a narrow prohibition only to the exact behavior it prohibits; never generalize it to remove the remaining category.

## Preserve two independent fields

Copy `source_authority_state` unchanged from the current authority manifest. Record `null` when no matching authority entry exists; do not invent a replacement Manifest state.

Give every unmatched route, screen, component, or other element its own row with `source_authority_state: null`. Keep that state `null` even when a related rule supplies conflict evidence; related evidence may appear only in the evidence or conflict fields and never donates its state. Classify the unmatched element `PROPOSAL`, or `UNKNOWN` when ambiguous, unless an exact cited rule expressly prohibits or contradicts that exact element; use `REJECTED` only in that exact-conflict case.

Assign `review_class` separately. Use only:

- `APPROVED`: exact, positively applicable `LOCKED` authority supports the element.
- `DERIVED_GAP`: a locked or conditional promise lacks a required definition, applicability decision, artifact, test, or acceptance mechanism.
- `PROPOSAL`: the element is plausible but is not authorized implementation scope.
- `REJECTED`: the element is prohibited, superseded, conflicts with higher authority, or is presented with false authority.
- `UNKNOWN`: evidence is absent, ambiguous, or contradictory.

Use `LOCKED` plus `DERIVED_GAP` only when a missing realization, evidence item, test, or subordinate definition is required to fulfill the same positively locked obligation. Never use that pairing when the product decision itself is open, unresolved, outside the positive extent, or merely mentioned in a locked boundary statement.

Never replace `source_authority_state` with `review_class` or a custom taxonomy.

## Apply authority states deterministically

| `source_authority_state` | Required handling | Implementation eligibility |
|---|---|---|
| `LOCKED` | Use `APPROVED` only for the exact rule extent when its applicability is positively satisfied and no conflict exists. Use `DERIVED_GAP` for a required missing definition, `REJECTED` for contradiction, and `UNKNOWN` for unresolved evidence. | Allow only the exact positively applicable `LOCKED` extent classified `APPROVED`. |
| `CONDITIONAL` | Do not use `APPROVED` while the current authority state remains conditional. Use `DERIVED_GAP` when the artifact depends on the unresolved applicability decision; use `UNKNOWN` when evidence is absent or contradictory. Route to the cited decision gate. | No. Require the applicability decision to be explicitly resolved and recorded as `LOCKED`. |
| `OPTIONAL_APPROVED` | Keep it optional. If included without a recorded selection, use `PROPOSAL`. If presented as mandatory, use `REJECTED`. Require the selection to be incorporated into current `LOCKED` authority before implementation. | No while it remains `OPTIONAL_APPROVED`. |
| `REFERENCE_ONLY` | Use it only as reference. Classify a commitment derived solely from it as `PROPOSAL`, or `REJECTED` when it is claimed as approved scope. | No. |
| `OPEN` | Use `DERIVED_GAP` when the artifact depends on the unresolved definition; use `UNKNOWN` when evidence is absent or ambiguous. Route to the cited owner or decision gate without choosing the answer. | No. |
| `null` | Use `PROPOSAL` for an explicit unauthorised proposal and `UNKNOWN` when the element or evidence is ambiguous. | No. |

## Produce an auditable ledger

Produce exactly one row for every inventoried element. Include all fields below; never substitute narrative citations for row-level evidence.

| Required field | Required value |
|---|---|
| `element_name` | The proposed or implied element. |
| `element_type` | Screen, navigation, component, action, role, permission, workflow, business process, management function, visible state, data behavior, release commitment, or another explicit type. |
| `artifact_location` | Exact section, page, frame, route, line, or other locator. |
| `source_authority_state` | The unchanged exact-match Manifest value, or `null` if no matching entry exists for this element. |
| `review_class` | One approved review class. |
| `authority_evidence_or_rule_or_decision_id` | Exact supporting or conflicting authority evidence, rule ID, or decision ID; use `null` when absent. |
| `applicability` | The exact satisfied, unsatisfied, or unresolved applicability condition. |
| `conflict` | The exact conflict or `none`. |
| `disposition` | Exactly `keep`, `remove`, `correct`, or `decision required`. |
| `decision_reference` | A literal recorded decision ID or named gate from validated inputs; otherwise `<named owner from validated inputs> — new decision required (no ID assigned)`; use `not applicable` only when no decision is needed. |
| `implementation_eligibility` | `YES — <exact LOCKED extent>` only when eligibility is proven; otherwise `NO`. |

For each non-eligible row, name the evidence, correction, or decision needed next. Route every unresolved scope choice to a named decision owner or gate. Never silently include or exclude it.

Before emitting the ledger, create an internal authority-clause binding for every non-`null` `source_authority_state` that identifies the exactly matching subject, predicate or property, polarity, and extent. Inspect every draft row and reject and regenerate the draft if any row:

- omits a formal identity, formal name, user-facing name, or other naming or identity claim present in the artifact;
- omits an applicable shared predicate for any separately named coordinated member;
- buries a condition or independent modifier only inside another row rather than giving it its own proposition and row;
- leaves any content-bearing source span without a proposition;
- leaves any proposition without exactly one ledger row;
- matches authority by lexical similarity, synonymy, shared topic, or related conflict instead of literal element identity and equal rule extent;
- assigns a non-`null` state to an unmatched element, including when related conflict evidence exists;
- lacks the required exact authority-clause binding for a non-`null` state;
- says in `applicability` that the element itself remains open or undefined while the cited clause positively locks only a parent, sibling, existence, ordering, or boundary proposition;
- contains more than one element or more than one authority-bearing proposition or state;
- uses a category bucket where the artifact supplies distinct members; or
- names a concrete product or technical element that is neither present nor necessarily implied by the artifact;
- leaves any explicit artifact directive only in narrative instead of giving it a ledger row;
- lacks artifact-first provenance to an explicit proposition or necessary implication and its exact artifact location;
- introduces a row solely from Manifest or other authority details;
- combines separately named policy sources, methods, directives, options, or propositions in one row; or
- assigns `null` when a dedicated exact state-bearing authority proposition exists.

Emit the ledger only after every row passes all checks and every frozen artifact proposition has exactly one row. Keep the established eleven fields unchanged.

## Judge the readiness claim

Refuse an unsupported `APPROVED FOR BUILD` claim without refusing the review task. Complete the inventory and ledger, then:

- Return `DECISION_REQUIRED` when unresolved applicability, missing evidence, a derived gap, an unselected option, or an open product definition blocks authorization.
- Return `REJECT` when the artifact conflicts with authority, claims false authority, or commits prohibited scope.
- If every row is eligible, state only that the authorization review is clear for the exact listed elements.

End with the exact evidence or decisions required next. Never equate authorization clearance with build readiness.

This skill checks authorization, not completeness. Route coverage obligations and missing-dimension analysis to a separate coverage review.

## Reject non-authority

Reject scope justified only by deadline, stakeholder demand, sunk cost, a competitor or reference product, a screenshot or mockup, common practice, “production readiness,” or model/product judgment. These inputs may explain a proposal; they cannot authorize implementation.

## Observed rationalizations

| Rationalization | Required response |
|---|---|
| “Production v1 requires filling in the obvious routes, roles, states, and release gates.” | Inventory each element and require exact positive `LOCKED` authority. |
| “Excluding the unresolved element is safer than including it.” | Treat exclusion as a scope decision and route it to the named gate. |
| “Foundational work can be committed before product details are settled.” | Mark only the exact positively applicable `LOCKED` extent eligible. |
| “A careful refusal or narrative explanation is enough.” | Complete the one-row-per-element ledger. |
| “The authority boundary is cited elsewhere in the review.” | Preserve `source_authority_state` and exact evidence on every row. |
| “We acknowledged the deadline, stakeholder, sunk-cost, or competitor pressure.” | Remove its effect from the final disposition; pressure is not authority. |

## Red flags — stop the handoff

- A production label is being used to invent product detail.
- An unresolved inclusion or exclusion is being decided silently.
- “Foundational” work is committed without a row-level positive-authority check.
- The review refuses approval but omits a complete element inventory.
- Manifest authority appears only in narrative prose, not on every row.
- Deadline, stakeholder, sunk-cost, competitor, mockup, common-practice, or reviewer judgment changes the final scope.

If any red flag appears, stop the handoff, correct the ledger, and route unresolved product choices to the named decision gate.

## Example

Assume the authority manifest records `RULE-17` as `OPEN`, with `DECISION-12` assigned to the product owner:

| `element_name` | `element_type` | `artifact_location` | `source_authority_state` | `review_class` | `authority_evidence_or_rule_or_decision_id` | `applicability` | `conflict` | `disposition` | `decision_reference` | `implementation_eligibility` |
|---|---|---|---|---|---|---|---|---|---|---|
| Account administration | workflow | Mockup A, sidebar item 4 | `OPEN` | `DERIVED_GAP` | `RULE-17`; `DECISION-12` | unresolved per `RULE-17` | Mockup presents the open workflow as settled | `decision required` | Product owner / `DECISION-12` | `NO` |

Do not choose the administration design. Return `DECISION_REQUIRED` and request the recorded outcome of `DECISION-12`.
