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
    const option = parseOption(parser, leadingComments);
    if (option) {
      ast.statements.push(option);
      continue;
    }
    const empty = parseEmpty(parser, leadingComments);
    if (empty) {
      ast.statements.push(empty);
      continue;
    }
    break;
  }
  return { ast, parser };
}

const whitespacePattern = /^\s+/;
const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
const intLitPattern = /^0(?:[0-7]*|x[0-9a-f]+)|^[1-9]\d*/i;
const floatLitPattern =
  /^\d+\.\d*(?:e[-+]?\d+)?|^\de[-+]?\d+|^\.\d+(?:e[-+]?\d+)?|^inf|^nan/i;
const boolLitPattern = /^true|^false/;
const strLitPattern =
  /^'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[abfnrtv\\'"]|[^'\0\n\\])*'|^"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[abfnrtv\\'"]|[^"\0\n\\])*"/i;
const identPattern = /^[a-z][a-z0-9_]*/i;

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

function parseIntLit(parser: RecursiveDescentParser): ast.IntLit | undefined {
  const intLit = parser.accept(intLitPattern);
  if (!intLit) return;
  return { type: "int-lit", ...intLit };
}

function parseSignedIntLit(
  parser: RecursiveDescentParser,
): ast.SignedIntLit | undefined {
  const loc = parser.loc;
  const sign = parser.accept("-") ?? parser.accept("+");
  const intLit = parseIntLit(parser);
  if (!intLit) {
    parser.loc = loc;
    return;
  }
  const start = sign?.start ?? intLit.start;
  const end = intLit.end;
  return { start, end, type: "signed-int-lit", sign, value: intLit };
}

function parseFloatLit(
  parser: RecursiveDescentParser,
): ast.FloatLit | undefined {
  const floatLit = parser.accept(floatLitPattern);
  if (!floatLit) return;
  return { type: "float-lit", ...floatLit };
}

function parseSignedFloatLit(
  parser: RecursiveDescentParser,
): ast.SignedFloatLit | undefined {
  const loc = parser.loc;
  const sign = parser.accept("-") ?? parser.accept("+");
  const floatLit = parseFloatLit(parser);
  if (!floatLit) {
    parser.loc = loc;
    return;
  }
  const start = sign?.start ?? floatLit.start;
  const end = floatLit.end;
  return { start, end, type: "signed-float-lit", sign, value: floatLit };
}

function parseBoolLit(parser: RecursiveDescentParser): ast.BoolLit | undefined {
  const boolLit = parser.accept(boolLitPattern);
  if (!boolLit) return;
  return { type: "bool-lit", ...boolLit };
}

function parseStrLit(parser: RecursiveDescentParser): ast.StrLit | undefined {
  const strLit = parser.accept(strLitPattern);
  if (!strLit) return;
  return { type: "str-lit", ...strLit };
}

function parseConstant(
  parser: RecursiveDescentParser,
): ast.Constant | undefined {
  return parseFullIdent(parser) ?? parseSignedIntLit(parser) ??
    parseSignedFloatLit(parser) ?? parseStrLit(parser) ?? parseBoolLit(parser);
}

function parseOptionNameSegment(
  parser: RecursiveDescentParser,
): ast.OptionNameSegment | undefined {
  const bracketOpen = parser.accept("(");
  const name = parseFullIdent(parser);
  if (!name) {
    if (bracketOpen) throw new SyntaxError(parser, [identPattern]);
    return;
  }
  const bracketClose = parser[bracketOpen ? "expect" : "accept"](")");
  const start = bracketOpen?.start ?? name.start;
  const end = bracketClose?.end ?? name.end;
  return {
    start,
    end,
    type: "option-name-segment",
    bracketOpen,
    name,
    bracketClose,
  };
}

function parseOptionName(
  parser: RecursiveDescentParser,
): ast.OptionName | undefined {
  const optionNameSegmentOrDots: ast.OptionName["optionNameSegmentOrDots"] = [];
  while (true) {
    const dot = parser.accept(".");
    if (dot) {
      optionNameSegmentOrDots.push({ type: "dot", ...dot });
      continue;
    }
    const optionNameSegment = parseOptionNameSegment(parser);
    if (optionNameSegment) {
      optionNameSegmentOrDots.push(optionNameSegment);
      continue;
    }
    break;
  }
  if (optionNameSegmentOrDots.length < 1) return;
  const first = optionNameSegmentOrDots[0];
  const last = optionNameSegmentOrDots[optionNameSegmentOrDots.length - 1];
  return {
    start: first.start,
    end: last.end,
    type: "option-name",
    optionNameSegmentOrDots,
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
  const quoteOpen = parser.expect(/^['"]/);
  const syntax = parser.expect(/^[^'"]+/);
  const quoteClose = parser.expect(/^['"]/);
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
  const keyword = parser.accept("import");
  if (!keyword) return;
  parseWhitespace(parser);
  const weakOrPublic = parser.expect(/^weak|^public/);
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
  const keyword = parser.accept("package");
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

function parseOption(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Option | undefined {
  const keyword = parser.accept("option");
  if (!keyword) return;
  parseWhitespace(parser);
  const optionName = parseOptionName(parser);
  if (!optionName) throw new SyntaxError(parser, ["(", identPattern]);
  parseWhitespace(parser);
  const eq = parser.expect("=");
  parseWhitespace(parser);
  const constant = parseConstant(parser);
  if (!constant) {
    throw new SyntaxError(parser, [
      identPattern,
      "-",
      "+",
      intLitPattern,
      strLitPattern,
      boolLitPattern,
    ]);
  }
  parseWhitespace(parser);
  const semi = parser.expect(";");
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "option",
    keyword,
    optionName,
    eq,
    constant,
    semi,
  };
}

function parseEmpty(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Empty | undefined {
  const semi = parser.accept(";");
  if (!semi) return;
  return {
    start: semi.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "empty",
    semi,
  };
}

function parseFieldOption(
  parser: RecursiveDescentParser,
): ast.FieldOption | undefined {
  const optionName = parseOptionName(parser);
  if (!optionName) return;
  parseWhitespace(parser);
  const eq = parser.expect("=");
  parseWhitespace(parser);
  const constant = parseConstant(parser);
  if (!constant) {
    throw new SyntaxError(parser, [
      identPattern,
      "-",
      "+",
      intLitPattern,
      strLitPattern,
      boolLitPattern,
    ]);
  }
  return {
    start: optionName.start,
    end: constant.end,
    type: "field-option",
    optionName,
    eq,
    constant,
  };
}

function parseFieldOptions(
  parser: RecursiveDescentParser,
): ast.FieldOptions | undefined {
  const bracketOpen = parser.accept("[");
  if (!bracketOpen) return;
  const fieldOptionOrCommas: ast.FieldOptions["fieldOptionOrCommas"] = [];
  while (true) {
    parseWhitespace(parser);
    const comma = parser.accept(",");
    if (comma) {
      fieldOptionOrCommas.push({ type: "comma", ...comma });
      continue;
    }
    const fieldOption = parseFieldOption(parser);
    if (fieldOption) {
      fieldOptionOrCommas.push(fieldOption);
      continue;
    }
    break;
  }
  const bracketClose = parser.expect("]");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "field-options",
    bracketOpen,
    fieldOptionOrCommas,
    bracketClose,
  };
}

function parseEnumField(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.EnumField | undefined {
  const fieldName = parser.accept(identPattern);
  if (!fieldName) return;
  parseWhitespace(parser);
  const eq = parser.expect("=");
  parseWhitespace(parser);
  const fieldNumber = parseSignedIntLit(parser);
  if (!fieldNumber) throw new SyntaxError(parser, ["-", intLitPattern]);
  parseWhitespace(parser);
  const fieldOptions = parseFieldOptions(parser);
  parseWhitespace(parser);
  const semi = parser.expect(";");
  return {
    start: fieldName.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "enum-field",
    fieldName,
    eq,
    fieldNumber,
    fieldOptions,
    semi,
  };
}
