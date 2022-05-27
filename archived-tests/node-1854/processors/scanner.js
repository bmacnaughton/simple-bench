'use strict';

const DASH = '-'.charCodeAt(0);

class Scanner {
  constructor(stopChars) {
    this.stopChars = [];
    for (const c of stopChars) {
      this.stopChars[c.charCodeAt(0)] = true;
    }
    this.prevByte = false;
  }

  suspicious(buffer) {
    for (let ix = 0; ix < buffer.length; ix++) {
      const byte = buffer[ix];
      if (this.stopChars[byte]) {
        return true;
      }
      if (byte === DASH) {
        if (this.prevByte) {
          return true;
        }
        this.prevByte = true;
      } else {
        this.prevByte = false;
      }
    }
    return false;
  }
}

module.exports = Scanner;
