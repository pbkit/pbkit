import * as ast from "../ast/index.ts";
import {
  createRecursiveDescentParser,
  RecursiveDescentParser,
  Token,
} from "./recursive-descent-parser.ts";

export interface ParseResult {
  ast: ast.Proto;
  parser: RecursiveDescentParser;
}

export function parse(text: string): ParseResult {
  const parser = createRecursiveDescentParser(text);
  const syntax = parseSyntax(parser);
  const ast: ast.Proto = { statements: [syntax] };
  while (true) {
    const comments = parseWhitespace(parser);
    // TODO
    break;
  }
  return { ast, parser };
}

export const whitespacePattern = /^\s+/;
export const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
export const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;

function parseWhitespace(parser: RecursiveDescentParser) {
  const result: Token[] = [];
  while (true) {
    const whitespace = parser.accept(whitespacePattern);
    if (whitespace) continue;
    const multilineComment = parser.accept(multilineCommentPattern);
    if (multilineComment) {
      result.push(multilineComment);
      continue;
    }
    const singlelineComment = parser.accept(singlelineCommentPattern);
    if (singlelineComment) {
      result.push(singlelineComment);
      continue;
    }
    break;
  }
  return result;
}

function parseSyntax(parser: RecursiveDescentParser): ast.Syntax {
  const comments = parseWhitespace(parser);
  const keyword = parser.expect("syntax");
  parseWhitespace(parser);
  const eq = parser.expect("=");
  parseWhitespace(parser);
  const quoteOpen = parser.expect(/'|"/);
  const syntax = parser.expect(/[^'"]+/);
  const quoteClose = parser.expect(/'|"/);
  parseWhitespace(parser);
  const semi = parser.expect(";");
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments: comments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "syntax",
    keyword,
    eq,
    quoteOpen,
    syntax,
    quoteClose,
    semi,
  };
}
