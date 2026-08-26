'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const HASH_PATTERN = /^[0-9A-F]{64}$/;
const REQUIRED_MANIFEST_KEYS = Object.freeze([
  'case_id',
  'schema_version',
  'inputs',
  'oracle',
  'candidate',
  'tools',
  'decision_registry',
  'required_headings',
  'expected_verdict',
  'run_provenance',
]);
const MANIFEST_KEYS = new Set([...REQUIRED_MANIFEST_KEYS, 'receipt']);

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

function assertOnlyKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) schemaError(`${label} contains unknown key ${key}`);
  }
}

function validateFileReference(reference, label, input = false) {
  if (!isRecord(reference)) schemaError(`${label} must be a file reference`);
  assertOnlyKeys(reference, new Set(input ? ['role', 'path', 'sha256'] : ['path', 'sha256']), label);
  if (!isAbsolutePath(reference.path)) {
    throw new Error(`RELATIVE_PATH_FORBIDDEN: ${label}.path must be absolute`);
  }
  if (!HASH_PATTERN.test(reference.sha256)) {
    schemaError(`${label}.sha256 must be 64-character uppercase hexadecimal`);
  }
  if (input && (typeof reference.role !== 'string' || reference.role.length === 0)) {
    schemaError(`${label}.role must be a non-empty string`);
  }
}

function validateManifest(manifest) {
  if (!isRecord(manifest)) schemaError('manifest must be an object');
  assertOnlyKeys(manifest, MANIFEST_KEYS, 'manifest');
  for (const key of REQUIRED_MANIFEST_KEYS) {
    if (!Object.hasOwn(manifest, key)) schemaError(`missing manifest key ${key}`);
  }
  if (typeof manifest.case_id !== 'string' || manifest.case_id.length === 0) {
    schemaError('case_id must be a non-empty string');
  }
  if (typeof manifest.schema_version !== 'string' || manifest.schema_version.length === 0) {
    schemaError('schema_version must be a non-empty string');
  }
  if (!Array.isArray(manifest.inputs) || manifest.inputs.length === 0) {
    schemaError('inputs must be a non-empty array');
  }
  if (!Array.isArray(manifest.tools)) schemaError('tools must be an array');
  if (!Array.isArray(manifest.required_headings)) {
    schemaError('required_headings must be an array');
  }
  if (typeof manifest.expected_verdict !== 'string') {
    schemaError('expected_verdict must be a string');
  }
  if (!isRecord(manifest.run_provenance)) {
    schemaError('run_provenance must be an object');
  }

  manifest.inputs.forEach((reference, index) => {
    validateFileReference(reference, `inputs[${index}]`, true);
  });
  if (manifest.inputs.filter(({ role }) => role === 'artifact').length !== 1) {
    schemaError('artifact input role required');
  }
  validateFileReference(manifest.oracle, 'oracle');
  validateFileReference(manifest.candidate, 'candidate');
  validateFileReference(manifest.decision_registry, 'decision_registry');
  manifest.tools.forEach((reference, index) => {
    validateFileReference(reference, `tools[${index}]`);
  });
  if (manifest.receipt !== undefined) validateFileReference(manifest.receipt, 'receipt');

  const declaredHeadingTargets = new Set([
    ...manifest.inputs.map(({ path: filePath }) => filePath),
    manifest.oracle.path,
    manifest.candidate.path,
    manifest.decision_registry.path,
    ...manifest.tools.map(({ path: filePath }) => filePath),
  ]);
  manifest.required_headings.forEach((requirement, index) => {
    if (!isRecord(requirement)) {
      schemaError(`required_headings[${index}] must be an object`);
    }
    assertOnlyKeys(requirement, new Set(['path', 'literal']), `required_headings[${index}]`);
    if (!isAbsolutePath(requirement.path)) {
      schemaError(`required_headings[${index}].path must be absolute`);
    }
    if (typeof requirement.literal !== 'string' || requirement.literal.length === 0) {
      schemaError(`required_headings[${index}].literal must be a non-empty string`);
    }
    if (!declaredHeadingTargets.has(requirement.path)) {
      schemaError(`undeclared heading target ${requirement.path}`);
    }
  });
}

function deepFreeze(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function loadJsonBuffer(buffer) {
  return JSON.parse(buffer.toString('utf8'));
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function loadFixture(manifestPath) {
  if (!isAbsolutePath(manifestPath)) {
    throw new Error('IMPLICIT_FIXTURE_FORBIDDEN: an absolute manifest path is required');
  }

  const manifest = loadJsonBuffer(fs.readFileSync(manifestPath));
  validateManifest(manifest);
  deepFreeze(manifest);
  const inputs = manifest.inputs;
  const tools = manifest.tools;
  const references = [
    ...inputs,
    manifest.oracle,
    manifest.candidate,
    manifest.decision_registry,
    ...tools,
    ...(manifest.receipt === undefined ? [] : [manifest.receipt]),
  ];

  const referenceBuffers = new Map();
  for (const reference of references) {
    if (!referenceBuffers.has(reference.path)) {
      referenceBuffers.set(reference.path, fs.readFileSync(reference.path));
    }
    const actualSha256 = sha256Buffer(referenceBuffers.get(reference.path));
    if (actualSha256 !== reference.sha256) {
      throw new Error(`HASH_MISMATCH: ${reference.path}`);
    }
  }

  const artifactInputs = inputs.filter(({ role }) => role === 'artifact');
  const caseIr = loadJsonBuffer(referenceBuffers.get(manifest.oracle.path));
  const decisionRegistry = loadJsonBuffer(referenceBuffers.get(manifest.decision_registry.path));
  const candidateIr = loadJsonBuffer(referenceBuffers.get(manifest.candidate.path));
  const receipt = manifest.receipt === undefined
    ? undefined
    : loadJsonBuffer(referenceBuffers.get(manifest.receipt.path));
  const sourceBuffer = Buffer.from(referenceBuffers.get(artifactInputs[0].path));
  const readPinnedText = (filePath) => {
    if (!referenceBuffers.has(filePath)) {
      schemaError(`undeclared pinned text target ${filePath}`);
    }
    return referenceBuffers.get(filePath).toString('utf8');
  };

  caseIr.decision_registry = decisionRegistry.entries;

  return {
    manifestPath,
    manifest,
    sourceBuffer,
    caseIr,
    candidateIr,
    receipt,
    readPinnedText,
  };
}

module.exports = { loadFixture };
