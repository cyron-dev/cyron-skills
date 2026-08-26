'use strict';

const FIELDS = Object.freeze([
  'subject',
  'predicate_or_property',
  'polarity',
  'modality',
  'quantifier_or_cardinality',
  'condition_scope',
  'exception_scope',
  'temporal_or_release_scope',
  'audience',
  'extent',
]);

function semanticKey(tuple) {
  for (const field of FIELDS) {
    if (typeof tuple?.[field] !== 'string' || tuple[field].length === 0) {
      throw new Error(`MISSING_TUPLE_FIELD: ${field}`);
    }
  }

  return JSON.stringify(FIELDS.map((field) => tuple[field]));
}

module.exports = { FIELDS, semanticKey };
