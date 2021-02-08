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
  const ast: ast.Proto = { statements: [] };
  while (true) {
    const leadingComments = parseWhitespace(parser);
    const syntax = parseSyntax(parser, leadingComments);
    if (syntax) {
      ast.statements.push(syntax);
      continue;
    }
    const importStatement = parseImport(parser, leadingComments);
    if (importStatement) {
      ast.statements.push(importStatement);
      continue;
    }
    break;
  }
  return { ast, parser };
}

export const whitespacePattern = /^\s+/;
export const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
export const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
export const strLitPattern =
  /'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[abfnrtv\\'"]|[^'\0\n\\])*'|"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[abfnrtv\\'"]|[^"\0\n\\])*"/i;

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

function parseSyntax(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Syntax | undefined {
  const keyword = parser.accept("syntax");
  if (!keyword) return;
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
    leadingComments,
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

function parseImport(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Import | undefined {
  const keyword = parser.expect("import");
  if (!keyword) return;
  parseWhitespace(parser);
  const weakOrPublic = parser.expect(/weak|public/);
  parseWhitespace(parser);
  const strLit = parser.expect("strLitPattern");
  parseWhitespace(parser);
  const semi = parser.expect(";");
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "import",
    keyword,
    weakOrPublic,
    strLit,
    semi,
  };
}
