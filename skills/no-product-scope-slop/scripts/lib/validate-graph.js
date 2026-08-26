'use strict';

const { semanticKey } = require('./semantic-key.js');

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function propositionIndex(propositions, bag, catalogue) {
  const byId = new Map();
  const semanticKeys = new Set();

  for (const proposition of asArray(propositions)) {
    const id = proposition?.id;
    const key = semanticKey(proposition?.tuple);

    if (byId.has(id)) {
      bag.add('DUPLICATE_ATOM', String(id), `${catalogue} duplicate proposition ID`);
    } else {
      byId.set(id, key);
    }

    if (semanticKeys.has(key)) {
      bag.add('DUPLICATE_ATOM', String(id), `${catalogue} duplicate semantic key`);
    }
    semanticKeys.add(key);
  }

  return { byId, semanticKeys };
}

function groupedSpanMappings(mappings) {
  const grouped = new Map();

  for (const mapping of asArray(mappings)) {
    const spanId = mapping?.span_id;
    if (!grouped.has(spanId)) {
      grouped.set(spanId, []);
    }
    grouped.get(spanId).push(...asArray(mapping?.proposition_ids));
  }

  return grouped;
}

function mappedSemanticKeys(propositionIds, index, bag, spanId, candidate) {
  const keys = new Set();

  for (const propositionId of propositionIds) {
    if (!index.has(propositionId)) {
      if (candidate) {
        bag.add(
          'EXTRA_ATOM',
          String(spanId),
          `unknown proposition ID: ${String(propositionId)}`,
        );
      }
      continue;
    }
    keys.add(index.get(propositionId));
  }

  return keys;
}

function compareSemanticSets(expected, actual, bag, path) {
  for (const key of expected) {
    if (!actual.has(key)) {
      bag.add('MISSING_ATOM', path, key);
    }
  }
  for (const key of actual) {
    if (!expected.has(key)) {
      bag.add('EXTRA_ATOM', path, key);
    }
  }
}

function validateSpanMappings(caseIr, candidateIr, oracleIndex, candidateIndex, bag) {
  const sourceRanges = asArray(caseIr?.source_ranges);
  const oracleSpans = groupedSpanMappings(caseIr?.span_to_propositions);
  const candidateSpans = groupedSpanMappings(candidateIr?.span_to_propositions);
  const sourceSpanIds = new Set(sourceRanges.map(({ id }) => id));

  for (const [spanId, propositionIds] of candidateSpans) {
    if (!sourceSpanIds.has(spanId)) {
      bag.add('EXTRA_ATOM', String(spanId), 'unknown span');
      mappedSemanticKeys(propositionIds, candidateIndex, bag, spanId, true);
    }
  }

  for (const range of sourceRanges) {
    const spanId = range?.id;
    const oracleHasMapping = oracleSpans.has(spanId);
    const candidateHasMapping = candidateSpans.has(spanId);

    if (range?.classification === 'content') {
      if (!oracleHasMapping) {
        bag.add('MISSING_ATOM', String(spanId), 'unmapped content range');
      }
      if (!candidateHasMapping) {
        bag.add('MISSING_ATOM', String(spanId), 'unmapped content range');
      }
    }

    const expected = mappedSemanticKeys(
      oracleSpans.get(spanId) || [],
      oracleIndex,
      bag,
      spanId,
      false,
    );
    const actual = mappedSemanticKeys(
      candidateSpans.get(spanId) || [],
      candidateIndex,
      bag,
      spanId,
      true,
    );

    compareSemanticSets(expected, actual, bag, String(spanId));
    if (expected.size > 1 && actual.size > 0 && actual.size < expected.size) {
      bag.add('GROUPED_ATOMS', String(spanId), 'multiple expected atoms mapped as a smaller set');
    }
  }
}

function validateLedger(candidateIr, candidateIndex, bag) {
  const ledgerRows = asArray(candidateIr?.ledger_rows);
  const links = asArray(candidateIr?.proposition_to_ledger_row);
  const rowIds = new Set();

  for (const row of ledgerRows) {
    const rowId = row?.id;
    if (rowIds.has(rowId)) {
      bag.add('NON_BIJECTIVE_LEDGER', String(rowId), 'duplicate ledger row ID');
    }
    rowIds.add(rowId);
  }

  const rowsByProposition = new Map(
    [...candidateIndex.keys()].map((propositionId) => [propositionId, []]),
  );
  const propositionsByRow = new Map([...rowIds].map((rowId) => [rowId, []]));

  links.forEach((link, index) => {
    const propositionId = link?.proposition_id;
    const rowId = link?.row_id;
    const propositionExists = candidateIndex.has(propositionId);
    const rowExists = rowIds.has(rowId);

    if (!propositionExists) {
      bag.add(
        'NON_BIJECTIVE_LEDGER',
        `proposition_to_ledger_row[${index}]`,
        `unknown proposition ID: ${String(propositionId)}`,
      );
    }
    if (!rowExists) {
      bag.add(
        'NON_BIJECTIVE_LEDGER',
        `proposition_to_ledger_row[${index}]`,
        `unknown ledger row ID: ${String(rowId)}`,
      );
    }

    if (propositionExists && rowExists) {
      rowsByProposition.get(propositionId).push(rowId);
      propositionsByRow.get(rowId).push(propositionId);
    }
  });

  for (const [propositionId, mappedRows] of rowsByProposition) {
    if (mappedRows.length !== 1) {
      bag.add(
        'NON_BIJECTIVE_LEDGER',
        String(propositionId),
        `expected exactly one ledger row; found ${mappedRows.length}`,
      );
    }
  }

  for (const [rowId, mappedPropositions] of propositionsByRow) {
    if (mappedPropositions.length !== 1) {
      bag.add(
        'NON_BIJECTIVE_LEDGER',
        String(rowId),
        `expected exactly one proposition; found ${mappedPropositions.length}`,
      );
    }
  }
}

function validateGraph(caseIr, candidateIr, bag) {
  const oracle = propositionIndex(caseIr?.required_propositions, bag, 'oracle');
  const candidate = propositionIndex(candidateIr?.propositions, bag, 'candidate');

  compareSemanticSets(oracle.semanticKeys, candidate.semanticKeys, bag, '');
  validateSpanMappings(caseIr, candidateIr, oracle.byId, candidate.byId, bag);
  validateLedger(candidateIr, candidate.byId, bag);
}

module.exports = { validateGraph };
