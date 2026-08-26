'use strict';

const { createHash } = require('node:crypto');

const NON_PROPOSITIONAL_REASONS = new Set([
  'blank_line',
  'markdown_marker',
  'punctuation_only',
  'grammar_only',
]);

function compareRanges(left, right) {
  const startDifference = left.start_byte - right.start_byte;
  if (!Number.isNaN(startDifference) && startDifference !== 0) {
    return startDifference;
  }

  const endDifference = left.end_byte - right.end_byte;
  if (!Number.isNaN(endDifference) && endDifference !== 0) {
    return endDifference;
  }

  const leftId = String(left.id);
  const rightId = String(right.id);
  if (leftId < rightId) return -1;
  if (leftId > rightId) return 1;
  return 0;
}

function interval(startByte, endByte) {
  return `[${startByte}, ${endByte})`;
}

function hasValidBounds(range, sourceLength) {
  return Number.isInteger(range.start_byte)
    && Number.isInteger(range.end_byte)
    && range.start_byte >= 0
    && range.start_byte < range.end_byte
    && range.end_byte <= sourceLength;
}

function hasValidClassification(range) {
  if (range.classification === 'content') {
    return range.reason === null;
  }

  return range.classification === 'non_propositional'
    && NON_PROPOSITIONAL_REASONS.has(range.reason);
}

function sliceSha256(source, startByte, endByte) {
  return createHash('sha256')
    .update(source.subarray(startByte, endByte))
    .digest('hex')
    .toUpperCase();
}

function validateRanges(source, ranges, bag) {
  if (!Buffer.isBuffer(source)) {
    throw new TypeError('source must be a Buffer');
  }
  if (!Array.isArray(ranges)) {
    throw new TypeError('ranges must be an array');
  }
  if (bag === null || typeof bag !== 'object' || typeof bag.add !== 'function') {
    throw new TypeError('bag must provide add(code, path, detail)');
  }

  const sortedRanges = ranges.slice().sort(compareRanges);
  const boundedRanges = [];

  for (const range of sortedRanges) {
    const rangeId = String(range.id);
    const boundsValid = hasValidBounds(range, source.length);

    if (!boundsValid) {
      bag.add(
        'SOURCE_RANGE_BOUNDS_INVALID',
        rangeId,
        `expected integers satisfying 0 <= start_byte < end_byte <= ${source.length}`,
      );
    }

    if (!hasValidClassification(range)) {
      bag.add(
        'SOURCE_RANGE_CLASSIFICATION_INVALID',
        rangeId,
        'classification and reason combination is invalid',
      );
    }

    if (!boundsValid) {
      continue;
    }

    boundedRanges.push(range);
    if (sliceSha256(source, range.start_byte, range.end_byte) !== range.slice_sha256) {
      bag.add(
        'HASH_MISMATCH',
        rangeId,
        'slice SHA-256 does not match source bytes',
      );
    }
  }

  let coveredUntil = 0;
  for (const range of boundedRanges) {
    if (range.start_byte > coveredUntil) {
      bag.add('SOURCE_RANGE_GAP', '', interval(coveredUntil, range.start_byte));
    } else if (range.start_byte < coveredUntil) {
      bag.add(
        'SOURCE_RANGE_OVERLAP',
        String(range.id),
        interval(range.start_byte, Math.min(coveredUntil, range.end_byte)),
      );
    }

    coveredUntil = Math.max(coveredUntil, range.end_byte);
  }

  if (coveredUntil < source.length) {
    bag.add('SOURCE_RANGE_GAP', '', interval(coveredUntil, source.length));
  }
}

module.exports = { validateRanges };
