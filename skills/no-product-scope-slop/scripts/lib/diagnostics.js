'use strict';

class DiagnosticBag {
  constructor() {
    this.diagnostics = [];
  }

  add(code, path = '', detail = '') {
    this.diagnostics.push({ code, path, detail });
  }

  codes() {
    return this.diagnostics.map(({ code }) => code);
  }

  toJSON() {
    return this.diagnostics
      .map((diagnostic) => ({ ...diagnostic }))
      .sort((left, right) => {
        const leftKey = `${left.code}\0${left.path}\0${left.detail}`;
        const rightKey = `${right.code}\0${right.path}\0${right.detail}`;

        if (leftKey < rightKey) return -1;
        if (leftKey > rightKey) return 1;
        return 0;
      });
  }
}

module.exports = { DiagnosticBag };
