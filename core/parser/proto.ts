import * as ast from "../ast/index.ts";
import {
  createRecursiveDescentParser,
  RecursiveDescentParser,
  SyntaxError,
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
    const packageStatement = parsePackage(parser, leadingComments);
    if (packageStatement) {
      ast.statements.push(packageStatement);
      continue;
    }
    break;
  }
  return { ast, parser };
}

const whitespacePattern = /^\s+/;
const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
const strLitPattern =
  /'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[abfnrtv\\'"]|[^'\0\n\\])*'|"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[abfnrtv\\'"]|[^"\0\n\\])*"/i;
const identPattern = /[a-z][a-z0-9_]*/i;

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

function parseFullIdent(
  parser: RecursiveDescentParser,
): ast.FullIdent | undefined {
  const identOrDots: ast.FullIdent["identOrDots"] = [];
  while (true) {
    const dot = parser.accept(".");
    if (dot) {
      identOrDots.push({ type: "dot", ...dot });
      continue;
    }
    const ident = parser.accept(identPattern);
    if (ident) {
      identOrDots.push({ type: "ident", ...ident });
      continue;
    }
    break;
  }
  if (identOrDots.length < 1) return;
  const first = identOrDots[0];
  const last = identOrDots[identOrDots.length - 1];
  return {
    start: first.start,
    end: last.end,
    type: "full-ident",
    identOrDots,
  };
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
  const strLit = parser.expect(strLitPattern);
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

function parsePackage(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Package | undefined {
  const keyword = parser.expect("package");
  if (!keyword) return;
  parseWhitespace(parser);
  const fullIdent = parseFullIdent(parser);
  if (!fullIdent) throw new SyntaxError(parser, [".", identPattern]);
  parseWhitespace(parser);
  const semi = parser.expect(";");
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "package",
    keyword,
    fullIdent,
    semi,
  };
}
