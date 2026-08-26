'use strict';

const path = require('node:path');
const { DiagnosticBag } = require('./diagnostics.js');
const { canonicalJson, sha256Text } = require('./hash.js');
const { loadFixture } = require('./load-fixture.js');
const { validateRanges } = require('./validate-ranges.js');
const { validateGraph } = require('./validate-graph.js');
const { deriveLedgerRows, validateAuthority } = require('./validate-authority.js');

const HASH_PATTERN = /^[0-9A-F]{64}$/;
function isAbsolutePath(value) {
  return typeof value === 'string' && (
    path.isAbsolute(value) || path.win32.isAbsolute(value)
  );
}

function schemaError(detail) {
  throw new Error(`SCHEMA_ERROR: ${detail}`);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateRequiredHeadings(bundle, bag) {
  for (const requirement of bundle.manifest.required_headings) {
    const lines = bundle.readPinnedText(requirement.path).split(/\r?\n/);
    if (!lines.includes(requirement.literal)) {
      bag.add('REQUIRED_HEADING_MISSING', requirement.path, requirement.literal);
    }
  }
}

function validateReceiptFreshness(bundle, bag) {
  if (bundle.receipt === undefined) return;
  if (!isRecord(bundle.receipt) || !Array.isArray(bundle.receipt.input_hashes)) {
    schemaError('receipt.input_hashes must be an array');
  }

  const currentGroups = new Map();
  for (const item of bundle.manifest.inputs) {
    if (!currentGroups.has(item.path)) currentGroups.set(item.path, []);
    currentGroups.get(item.path).push(item.sha256);
  }

  const receiptGroups = new Map();
  bundle.receipt.input_hashes.forEach((item, index) => {
    if (
      !isRecord(item)
      || !isAbsolutePath(item.path)
      || !HASH_PATTERN.test(item.sha256)
    ) {
      schemaError(`receipt.input_hashes[${index}] must be an absolute pinned hash pair`);
    }
    if (!receiptGroups.has(item.path)) receiptGroups.set(item.path, []);
    receiptGroups.get(item.path).push(item.sha256);
  });

  const allPaths = new Set([...currentGroups.keys(), ...receiptGroups.keys()]);
  for (const filePath of allPaths) {
    const current = currentGroups.get(filePath) || [];
    const prior = receiptGroups.get(filePath) || [];
    if (current.length > 1) {
      bag.add('STALE_RECEIPT', filePath, 'duplicate current input path');
      continue;
    }
    if (prior.length > 1) {
      bag.add('STALE_RECEIPT', filePath, 'duplicate receipt input path');
      continue;
    }
    if (current.length === 0) {
      bag.add('STALE_RECEIPT', filePath, 'receipt input absent from current manifest');
    } else if (prior.length === 0) {
      bag.add('STALE_RECEIPT', filePath, 'current input absent from receipt');
    } else if (current[0] !== prior[0]) {
      bag.add('STALE_RECEIPT', filePath, prior[0]);
    }
  }
}

function compileAudit(manifestPath) {
  const bundle = loadFixture(manifestPath);
  const bag = new DiagnosticBag();

  validateRanges(bundle.sourceBuffer, bundle.caseIr.source_ranges, bag);
  validateGraph(bundle.caseIr, bundle.candidateIr, bag);
  validateAuthority(bundle.caseIr, bundle.candidateIr, bag);
  const ledgerRows = deriveLedgerRows(bundle.caseIr, bundle.candidateIr);
  validateRequiredHeadings(bundle, bag);
  validateReceiptFreshness(bundle, bag);

  const diagnostics = bag.toJSON();
  const canonicalIr = {
    case_id: bundle.manifest.case_id,
    propositions: bundle.candidateIr.propositions,
    ledger_rows: ledgerRows,
  };

  return {
    case_id: bundle.manifest.case_id,
    schema_version: bundle.manifest.schema_version,
    input_hashes: bundle.manifest.inputs.map(({ path: filePath, sha256 }) => ({
      path: filePath,
      sha256,
    })),
    canonical_ir_sha256: sha256Text(canonicalJson(canonicalIr)),
    diagnostics,
    verdict: diagnostics.length === 0 && bundle.manifest.expected_verdict === 'PASS'
      ? 'PASS'
      : 'REJECT',
  };
}

module.exports = { compileAudit };
