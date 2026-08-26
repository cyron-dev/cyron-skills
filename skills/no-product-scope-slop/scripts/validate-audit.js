'use strict';

const { compileAudit } = require('./lib/compile-audit.js');
const { canonicalJson } = require('./lib/hash.js');

function failInvocation() {
  process.stderr.write('INVALID_INVOCATION: --manifest <absolute-path> required\n');
  process.exitCode = 2;
}

function main(args) {
  if (args.length !== 2 || args[0] !== '--manifest' || args[1].length === 0) {
    failInvocation();
    return;
  }

  try {
    const payload = compileAudit(args[1]);
    process.stdout.write(canonicalJson(payload));
    process.exitCode = payload.verdict === 'PASS' ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

main(process.argv.slice(2));
