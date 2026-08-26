'use strict';

const { semanticKey } = require('./semantic-key.js');

const REVIEW_FIELDS = Object.freeze([
  'review_class',
  'applicability_status',
  'conflict_status',
  'disposition',
  'decision_reference',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compareValues(left, right) {
  const leftValue = String(left ?? '');
  const rightValue = String(right ?? '');
  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return 0;
}

function ordered(values, key) {
  return [...asArray(values)].sort((left, right) => compareValues(key(left), key(right)));
}

function pairKey(propositionId, value) {
  return JSON.stringify([propositionId, value]);
}

function safeSemanticKey(tuple) {
  try {
    return semanticKey(tuple);
  } catch {
    return null;
  }
}

function uniqueIndex(values, idField) {
  const counts = new Map();
  for (const value of asArray(values)) {
    const id = value?.[idField];
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const index = new Map();
  for (const value of asArray(values)) {
    const id = value?.[idField];
    if (counts.get(id) === 1) {
      index.set(id, value);
    }
  }
  return { counts, index };
}

function authorityContext(caseIr, candidateIr) {
  const authorities = uniqueIndex(caseIr?.authority_propositions, 'id');
  const propositions = uniqueIndex(candidateIr?.propositions, 'id');
  const allowedPairs = new Set(asArray(caseIr?.allowed_bindings).map((binding) => pairKey(
    binding?.proposition_id,
    binding?.authority_proposition_id,
  )));

  const derivedStates = new Map();
  const statesByProposition = new Map();
  const invalidNonNullRequests = new Set();

  for (const request of asArray(candidateIr?.requested_authority_bindings)) {
    const propositionId = request?.proposition_id;
    const authorityId = request?.authority_proposition_id;
    if (authorityId === null || authorityId === undefined) continue;

    const proposition = propositions.index.get(propositionId);
    const authority = authorities.index.get(authorityId);
    const exactTuple = (
      proposition
      && authority
      && safeSemanticKey(proposition.tuple) !== null
      && safeSemanticKey(proposition.tuple) === safeSemanticKey(authority.tuple)
    );
    const explicitlyAllowed = allowedPairs.has(pairKey(propositionId, authorityId));

    if (!exactTuple || !explicitlyAllowed) {
      invalidNonNullRequests.add(propositionId);
    } else {
      if (!statesByProposition.has(propositionId)) {
        statesByProposition.set(propositionId, new Set());
      }
      statesByProposition.get(propositionId).add(authority.state);
    }
  }

  for (const [propositionId, states] of statesByProposition) {
    if (!invalidNonNullRequests.has(propositionId) && states.size === 1) {
      derivedStates.set(propositionId, [...states][0]);
    }
  }

  return {
    authorities,
    propositions,
    allowedPairs,
    derivedStates,
  };
}

function expectedReviewIndex(caseIr) {
  return uniqueIndex(caseIr?.expected_reviews, 'proposition_id').index;
}

function propositionByRow(candidateIr) {
  const grouped = new Map();
  for (const link of asArray(candidateIr?.proposition_to_ledger_row)) {
    const rowId = link?.row_id;
    if (!grouped.has(rowId)) grouped.set(rowId, []);
    grouped.get(rowId).push(link?.proposition_id);
  }

  const result = new Map();
  for (const [rowId, propositionIds] of grouped) {
    if (propositionIds.length === 1) {
      result.set(rowId, propositionIds[0]);
    }
  }
  return result;
}

function expectedEligibility(state, review, elementName) {
  const eligible = (
    state === 'LOCKED'
    && review?.review_class === 'APPROVED'
    && review?.applicability_status === 'satisfied'
    && review?.conflict_status === 'none'
  );
  return eligible ? `YES — ${String(elementName)}` : 'NO';
}

function deriveLedgerRows(caseIr, candidateIr) {
  const { derivedStates } = authorityContext(caseIr, candidateIr);
  const expectedReviews = expectedReviewIndex(caseIr);
  const rowPropositions = propositionByRow(candidateIr);

  return asArray(candidateIr?.ledger_rows).map((row) => {
    const propositionId = rowPropositions.get(row?.id);
    const state = derivedStates.get(propositionId) ?? null;
    const review = expectedReviews.get(propositionId);

    return {
      ...row,
      source_authority_state: state,
      review_class: review?.review_class ?? null,
      applicability: review?.applicability_status ?? null,
      conflict: review?.conflict_status ?? null,
      disposition: review?.disposition ?? null,
      decision_reference: review?.decision_reference ?? null,
      implementation_eligibility: expectedEligibility(state, review, row?.element_name),
    };
  });
}

function validateAuthorityIds(caseIr, context, bag) {
  for (const [id, count] of [...context.authorities.counts].sort((left, right) => (
    compareValues(left[0], right[0])
  ))) {
    if (count > 1) {
      bag.add('UNKNOWN_AUTHORITY_PROPOSITION', String(id), 'duplicate authority proposition ID');
    }
  }
}

function validateRequestedBindings(caseIr, candidateIr, context, bag) {
  const requests = ordered(
    candidateIr?.requested_authority_bindings,
    (request) => pairKey(request?.proposition_id, request?.authority_proposition_id),
  );

  for (const request of requests) {
    const propositionId = request?.proposition_id;
    const authorityId = request?.authority_proposition_id;
    const proposition = context.propositions.index.get(propositionId);

    if (!proposition) {
      bag.add(
        'UNKNOWN_AUTHORITY_PROPOSITION',
        String(propositionId),
        'unknown artifact proposition ID',
      );
    }

    if (authorityId === null || authorityId === undefined) continue;

    const authority = context.authorities.index.get(authorityId);
    if (!authority) {
      bag.add(
        'UNKNOWN_AUTHORITY_PROPOSITION',
        String(authorityId),
        'unknown authority proposition ID',
      );
    }

    const propositionKey = proposition ? safeSemanticKey(proposition.tuple) : null;
    const authorityKey = authority ? safeSemanticKey(authority.tuple) : null;
    const exactTuple = propositionKey !== null && propositionKey === authorityKey;
    const explicitlyAllowed = context.allowedPairs.has(pairKey(propositionId, authorityId));

    if (!proposition || !authority || !exactTuple || !explicitlyAllowed) {
      bag.add(
        'BAD_STATE_TRANSFER',
        String(propositionId),
        'requested authority binding is not exact and allowed',
      );
    }
  }

  const requestPairs = new Set(requests.map((request) => pairKey(
    request?.proposition_id,
    request?.authority_proposition_id,
  )));
  for (const allowed of ordered(
    caseIr?.allowed_bindings,
    (binding) => pairKey(binding?.proposition_id, binding?.authority_proposition_id),
  )) {
    const key = pairKey(allowed?.proposition_id, allowed?.authority_proposition_id);
    if (!requestPairs.has(key)) {
      bag.add(
        'MISSED_EXACT_AUTHORITY',
        String(allowed?.proposition_id),
        String(allowed?.authority_proposition_id),
      );
    }
  }
}

function registryValues(caseIr) {
  return new Set(asArray(caseIr?.decision_registry).map((entry) => {
    if (typeof entry === 'string') return entry;
    return entry?.id ?? entry?.reference ?? entry?.name;
  }));
}

function validateDecisionReferences(caseIr, candidateIr, bag) {
  const registry = registryValues(caseIr);
  const allowed = new Set(asArray(caseIr?.allowed_decision_references).map((reference) => pairKey(
    reference?.proposition_id,
    reference?.decision_reference,
  )));

  for (const reference of ordered(
    candidateIr?.decision_references,
    (value) => pairKey(value?.proposition_id, value?.decision_reference),
  )) {
    const propositionId = reference?.proposition_id;
    const decisionReference = reference?.decision_reference;
    if (
      !registry.has(decisionReference)
      || !allowed.has(pairKey(propositionId, decisionReference))
    ) {
      bag.add(
        'INVALID_DECISION_REFERENCE',
        String(propositionId),
        String(decisionReference),
      );
    }
  }
}

function groupedByProposition(values) {
  const grouped = new Map();
  for (const value of asArray(values)) {
    const propositionId = value?.proposition_id;
    if (!grouped.has(propositionId)) grouped.set(propositionId, []);
    grouped.get(propositionId).push(value);
  }
  return grouped;
}

function validateReviewProofs(caseIr, candidateIr, bag) {
  const expected = groupedByProposition(caseIr?.expected_reviews);
  const proofs = groupedByProposition(candidateIr?.review_proofs);
  const propositionIds = new Set([...expected.keys(), ...proofs.keys()]);

  for (const propositionId of [...propositionIds].sort(compareValues)) {
    const expectedValues = expected.get(propositionId) || [];
    const proofValues = proofs.get(propositionId) || [];

    if (expectedValues.length === 0) {
      bag.add('REVIEW_DECISION_MISMATCH', String(propositionId), 'expected_review');
      continue;
    }

    if (expectedValues.length !== 1 || proofValues.length !== 1) {
      bag.add('REVIEW_DECISION_MISMATCH', String(propositionId), 'review_proof');
      continue;
    }

    const oracle = expectedValues[0];
    const proof = proofValues[0];
    for (const field of REVIEW_FIELDS) {
      if (proof?.[field] !== oracle?.[field]) {
        bag.add('REVIEW_DECISION_MISMATCH', String(propositionId), field);
      }
    }
  }
}

function validateGraphReferences(candidateIr, context, bag) {
  const rowIds = new Set(asArray(candidateIr?.ledger_rows).map((row) => row?.id));
  for (const link of ordered(
    candidateIr?.proposition_to_ledger_row,
    (value) => pairKey(value?.proposition_id, value?.row_id),
  )) {
    const propositionId = link?.proposition_id;
    const rowId = link?.row_id;
    if (!context.propositions.index.has(propositionId)) {
      bag.add(
        'UNKNOWN_AUTHORITY_PROPOSITION',
        String(propositionId),
        'unknown artifact proposition ID in ledger link',
      );
    }
    if (!rowIds.has(rowId)) {
      bag.add(
        'UNKNOWN_AUTHORITY_PROPOSITION',
        String(propositionId),
        `unknown ledger row ID: ${String(rowId)}`,
      );
    }
  }
}

function validateRows(caseIr, candidateIr, context, bag) {
  const rowPropositions = propositionByRow(candidateIr);
  const derivedByRow = new Map(deriveLedgerRows(caseIr, candidateIr).map((row) => [row?.id, row]));

  for (const row of ordered(candidateIr?.ledger_rows, (value) => value?.id)) {
    const propositionId = rowPropositions.get(row?.id);
    const path = String(propositionId ?? row?.id);
    const derived = derivedByRow.get(row?.id);

    if (!propositionId || !context.propositions.index.has(propositionId)) {
      bag.add('UNKNOWN_AUTHORITY_PROPOSITION', path, 'invalid ledger proposition reference');
    }

    if (row?.source_authority_state !== derived?.source_authority_state) {
      bag.add('BAD_STATE_TRANSFER', path, 'candidate source authority state differs from derived state');
    }

    if (row?.implementation_eligibility !== derived?.implementation_eligibility) {
      bag.add('ELIGIBILITY_VIOLATION', path, String(derived?.implementation_eligibility));
    }
  }
}

function validateAuthority(caseIr, candidateIr, bag) {
  const context = authorityContext(caseIr, candidateIr);
  validateAuthorityIds(caseIr, context, bag);
  validateRequestedBindings(caseIr, candidateIr, context, bag);
  validateDecisionReferences(caseIr, candidateIr, bag);
  validateReviewProofs(caseIr, candidateIr, bag);
  validateGraphReferences(candidateIr, context, bag);
  validateRows(caseIr, candidateIr, context, bag);
}

module.exports = { validateAuthority, deriveLedgerRows };
