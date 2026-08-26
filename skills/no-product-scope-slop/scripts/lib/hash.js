'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');

function uppercaseSha256(value) {
  return createHash('sha256').update(value).digest('hex').toUpperCase();
}

function sha256File(filePath) {
  return uppercaseSha256(fs.readFileSync(filePath));
}

function sha256Text(text) {
  return uppercaseSha256(Buffer.from(text, 'utf8'));
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item));
  }

  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJsonValue(value[key]);
    }
    return sorted;
  }

  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;
}

module.exports = {
  sha256File,
  sha256Text,
  canonicalJson,
};
