export interface RecursiveDescentParser {
  readonly input: string;
  loc: number;
  offsetToColRow: (offset: number) => ColRow;
  colRowToOffset: (colRow: ColRow) => number;
  getAroundText: (loc: number, length?: number, window?: number) => string;
  try(pattern: Pattern): Token | undefined;
  accept(pattern: Pattern): Token | undefined;
  expect(
    acceptPattern: Pattern,
    expectedPatterns?: Pattern[],
    mistakePatterns?: Pattern[],
  ): Token;
}
export interface RecursiveDescentParserConfig {
  debug: boolean;
}
export interface Span {
  start: number;
  end: number;
}
export interface ColRow {
  col: number;
  row: number;
}
export interface Token extends Span {
  text: string;
}
export type Pattern = string | RegExp | typeof eof;
export const eof = Symbol("<EOF>");
export function createRecursiveDescentParser(
  input: string,
  config?: Partial<RecursiveDescentParserConfig>,
): RecursiveDescentParser {
  const debug = !!config?.debug;
  let cnt = 0;
  const lines = input.split("\n");
  const parser: RecursiveDescentParser = {
    input,
    loc: 0,
    offsetToColRow: (offset) => offsetToColRow(lines, offset),
    colRowToOffset: (colRow) => colRowToOffset(lines, colRow),
    getAroundText: (loc, length, window) =>
      getAroundText(
        lines,
        loc,
        length,
        window,
      ),
    try(pattern) {
      const loc = parser.loc;
      try {
        return parser.accept(pattern);
      } finally {
        parser.loc = loc;
      }
    },
    accept(pattern) {
      cnt++;
      if (cnt > input.length * 5) throw `infinite loop`;
      if (pattern === eof) return acceptEof();
      if (typeof pattern === "string") return acceptString(pattern);
      return acceptRegex(pattern);
    },
    expect(acceptPattern, expectedPatterns, mistakePatterns) {
      const result = parser.accept(acceptPattern);
      const _expectedPatterns: Pattern[] = (
        expectedPatterns
          ? [acceptPattern, ...expectedPatterns]
          : [acceptPattern]
      );
      if (result == null) {
        throw new SyntaxError(parser, _expectedPatterns, mistakePatterns);
      } else {
        return result;
      }
    },
  };
  function acceptEof(): Token | undefined {
    if (parser.loc < input.length) return;
    return { start: parser.loc, end: parser.loc, text: "" };
  }
  function acceptString(pattern: string): Token | undefined {
    const start = parser.loc;
    const end = start + pattern.length;
    const text = input.slice(start, end);
    if (text !== pattern) return;
    parser.loc = end;
    debug && console.log(text);
    return { start, end, text };
  }
  function acceptRegex(pattern: RegExp): Token | undefined {
    pattern.lastIndex = 0;
    const execArray = pattern.exec(input.substr(parser.loc));
    if (execArray == null) return;
    const text = execArray[0];
    const start = parser.loc + execArray.index;
    const end = start + text.length;
    parser.loc = end;
    debug && console.log(text);
    return { start, end, text };
  }
  return parser;
}

export class SyntaxError extends Error {
  constructor(
    public parser: RecursiveDescentParser,
    public expectedPatterns: Pattern[],
    public mistakePatterns: Pattern[] = [],
  ) {
    super();
    const colRow = this.colRow;
    const got = this.got;
    const length = got === eof ? 1 : got.length;
    const expectedPatternsText = expectedPatterns.map(patternToString).join(
      " or ",
    );
    this.message = (
      `at line ${colRow.row + 1}, column ${colRow.col + 1}:\n\n` +
      `expected ${expectedPatternsText}, got ${patternToString(got)}\n\n` +
      parser.getAroundText(parser.loc, length)
    );
  }
  get got() {
    const parser = this.parser;
    for (const mistakePattern of this.mistakePatterns) {
      const token = parser.try(mistakePattern);
      if (token) return token.text;
    }
    return parser.input.charAt(parser.loc) || eof;
  }
  get colRow() {
    return this.parser.offsetToColRow(this.parser.loc);
  }
}

function patternToString(pattern: Pattern) {
  if (pattern === eof) return "<EOF>";
  if (typeof pattern === "string") return JSON.stringify(pattern);
  return pattern.toString();
}

function offsetToColRow(lines: string[], offset: number) {
  let row = 0;
  let col = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (offset < line.length + 1) {
      row = i;
      col = offset;
      break;
    }
    offset -= line.length + 1;
  }
  return { col, row };
}

function colRowToOffset(lines: string[], { col, row }: ColRow) {
  let offset = 0;
  for (let i = 0; i < row; i++) {
    offset += lines[i].length + 1;
  }
  return offset + col;
}

function getAroundText(
  lines: string[],
  loc: number,
  length: number = 1,
  window: number = 5,
) {
  const colRow = offsetToColRow(lines, loc);
  const headCount = Math.min(1, (window >> 1) + (window % 2));
  const tailCount = window >> 1;
  const headStart = Math.max(0, colRow.row - headCount - 1);
  const headEnd = colRow.row + 1;
  const tailStart = colRow.row + 1;
  const tailEnd = colRow.row + tailCount + 1;
  const heads = lines.slice(headStart, headEnd);
  const tails = lines.slice(tailStart, tailEnd);
  const lineNumberDigitCount = tailEnd.toString().length;
  const headTexts = heads.map((line, index) => {
    const lineNumber = index + headStart + 1;
    const lineNumberText = lineNumber.toString().padStart(
      lineNumberDigitCount + 1,
    );
    return lineNumberText + " | " + line;
  }).join("\n");
  const tailTexts = tails.map((line, index) => {
    const lineNumber = index + tailStart + 1;
    const lineNumberText = lineNumber.toString().padStart(
      lineNumberDigitCount + 1,
    );
    return lineNumberText + " | " + line;
  }).join("\n");
  return [
    headTexts,
    (new Array(lineNumberDigitCount + 1 + 1)).join(" ") + " | " +
    (new Array(colRow.col + 1)).join(" ") +
    (new Array(length + 1)).join("^"),
    tailTexts,
  ].join("\n");
}
