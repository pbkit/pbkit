export default class Long extends Uint32Array {
  constructor(lo: number = 0, hi: number = 0) {
    super([lo, hi]);
  }
  toString(signed = true): string {
    const [lo, hi] = this;
    if (!hi) return lo.toString();
    throw "TODO";
  }
  static parse(text: string): Long {
    if (text.length <= 10) {
      const value = parseInt(text, 10);
      if ((0 <= value) && (value <= 4294967295)) return new Long(value);
    }
    throw "TODO";
  }
}

function add(a: Long, b: Long): Long {
  throw "TODO";
}

function sub(a: Long, b: Long): Long {
  throw "TODO";
}

function mul(a: Long, b: Long): Long {
  throw "TODO";
}

function div(a: Long, b: Long): Long {
  throw "TODO";
}
