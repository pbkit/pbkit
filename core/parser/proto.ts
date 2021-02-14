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
  const statements = acceptStatements<ast.TopLevelStatement>(parser, [
    acceptSyntax,
    acceptImport,
    acceptPackage,
    acceptOption,
    acceptEnum,
    acceptEmpty,
  ]);
  const ast: ast.Proto = { statements };
  return { ast, parser };
}

interface AcceptStatementFn<T extends ast.StatementBase> {
  (parser: RecursiveDescentParser, leadingComments: Token[]): T | undefined;
}
function acceptStatements<T extends ast.StatementBase>(
  parser: RecursiveDescentParser,
  acceptStatementFns: AcceptStatementFn<T>[],
) {
  const statements: T[] = [];
  statements:
  while (true) {
    const leadingComments = acceptWhitespace(parser);
    for (const acceptStatementFn of acceptStatementFns) {
      const statement = acceptStatementFn(parser, leadingComments);
      if (statement) {
        statements.push(statement);
        continue statements;
      }
    }
    break;
  }
  return statements;
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

function acceptWhitespace(parser: RecursiveDescentParser) {
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

function acceptFullIdent(
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

function expectFullIdent(parser: RecursiveDescentParser): ast.FullIdent {
  const fullIdent = acceptFullIdent(parser);
  if (fullIdent) return fullIdent;
  throw new SyntaxError(parser, [".", identPattern]);
}

function acceptIntLit(parser: RecursiveDescentParser): ast.IntLit | undefined {
  const intLit = parser.accept(intLitPattern);
  if (!intLit) return;
  return { type: "int-lit", ...intLit };
}

function acceptSignedIntLit(
  parser: RecursiveDescentParser,
): ast.SignedIntLit | undefined {
  const loc = parser.loc;
  const sign = parser.accept("-") ?? parser.accept("+");
  const intLit = acceptIntLit(parser);
  if (!intLit) {
    parser.loc = loc;
    return;
  }
  const start = sign?.start ?? intLit.start;
  const end = intLit.end;
  return { start, end, type: "signed-int-lit", sign, value: intLit };
}

function expectSignedIntLit(parser: RecursiveDescentParser): ast.SignedIntLit {
  const signedIntLit = acceptSignedIntLit(parser);
  if (signedIntLit) return signedIntLit;
  throw new SyntaxError(parser, ["-", intLitPattern]);
}

function acceptFloatLit(
  parser: RecursiveDescentParser,
): ast.FloatLit | undefined {
  const floatLit = parser.accept(floatLitPattern);
  if (!floatLit) return;
  return { type: "float-lit", ...floatLit };
}

function acceptSignedFloatLit(
  parser: RecursiveDescentParser,
): ast.SignedFloatLit | undefined {
  const loc = parser.loc;
  const sign = parser.accept("-") ?? parser.accept("+");
  const floatLit = acceptFloatLit(parser);
  if (!floatLit) {
    parser.loc = loc;
    return;
  }
  const start = sign?.start ?? floatLit.start;
  const end = floatLit.end;
  return { start, end, type: "signed-float-lit", sign, value: floatLit };
}

function acceptBoolLit(
  parser: RecursiveDescentParser,
): ast.BoolLit | undefined {
  const boolLit = parser.accept(boolLitPattern);
  if (!boolLit) return;
  return { type: "bool-lit", ...boolLit };
}

function acceptStrLit(parser: RecursiveDescentParser): ast.StrLit | undefined {
  const strLit = parser.accept(strLitPattern);
  if (!strLit) return;
  return { type: "str-lit", ...strLit };
}

function acceptConstant(
  parser: RecursiveDescentParser,
): ast.Constant | undefined {
  return acceptFullIdent(parser) ?? acceptSignedIntLit(parser) ??
    acceptSignedFloatLit(parser) ?? acceptStrLit(parser) ??
    acceptBoolLit(parser);
}

function expectConstant(parser: RecursiveDescentParser): ast.Constant {
  const constant = acceptConstant(parser);
  if (constant) return constant;
  throw new SyntaxError(parser, [
    identPattern,
    "-",
    "+",
    intLitPattern,
    strLitPattern,
    boolLitPattern,
  ]);
}

function acceptOptionNameSegment(
  parser: RecursiveDescentParser,
): ast.OptionNameSegment | undefined {
  const bracketOpen = parser.accept("(");
  const name = acceptFullIdent(parser);
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

function acceptOptionName(
  parser: RecursiveDescentParser,
): ast.OptionName | undefined {
  const optionNameSegmentOrDots: ast.OptionName["optionNameSegmentOrDots"] = [];
  while (true) {
    const dot = parser.accept(".");
    if (dot) {
      optionNameSegmentOrDots.push({ type: "dot", ...dot });
      continue;
    }
    const optionNameSegment = acceptOptionNameSegment(parser);
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

function expectOptionName(parser: RecursiveDescentParser): ast.OptionName {
  const optionName = acceptOptionName(parser);
  if (optionName) return optionName;
  throw new SyntaxError(parser, ["(", identPattern]);
}

function acceptSyntax(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Syntax | undefined {
  const keyword = parser.accept("syntax");
  if (!keyword) return;
  acceptWhitespace(parser);
  const eq = parser.expect("=");
  acceptWhitespace(parser);
  const quoteOpen = parser.expect(/^['"]/);
  const syntax = parser.expect(/^[^'"]+/);
  const quoteClose = parser.expect(/^['"]/);
  acceptWhitespace(parser);
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

function acceptImport(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Import | undefined {
  const keyword = parser.accept("import");
  if (!keyword) return;
  acceptWhitespace(parser);
  const weakOrPublic = parser.expect(/^weak|^public/);
  acceptWhitespace(parser);
  const strLit = parser.expect(strLitPattern);
  acceptWhitespace(parser);
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

function acceptPackage(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Package | undefined {
  const keyword = parser.accept("package");
  if (!keyword) return;
  acceptWhitespace(parser);
  const fullIdent = expectFullIdent(parser);
  acceptWhitespace(parser);
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

function acceptOption(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Option | undefined {
  const keyword = parser.accept("option");
  if (!keyword) return;
  acceptWhitespace(parser);
  const optionName = expectOptionName(parser);
  acceptWhitespace(parser);
  const eq = parser.expect("=");
  acceptWhitespace(parser);
  const constant = expectConstant(parser);
  acceptWhitespace(parser);
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

function acceptEmpty(
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

function acceptFieldOption(
  parser: RecursiveDescentParser,
): ast.FieldOption | undefined {
  const optionName = acceptOptionName(parser);
  if (!optionName) return;
  acceptWhitespace(parser);
  const eq = parser.expect("=");
  acceptWhitespace(parser);
  const constant = expectConstant(parser);
  return {
    start: optionName.start,
    end: constant.end,
    type: "field-option",
    optionName,
    eq,
    constant,
  };
}

function acceptFieldOptions(
  parser: RecursiveDescentParser,
): ast.FieldOptions | undefined {
  const bracketOpen = parser.accept("[");
  if (!bracketOpen) return;
  const fieldOptionOrCommas: ast.FieldOptions["fieldOptionOrCommas"] = [];
  while (true) {
    acceptWhitespace(parser);
    const comma = parser.accept(",");
    if (comma) {
      fieldOptionOrCommas.push({ type: "comma", ...comma });
      continue;
    }
    const fieldOption = acceptFieldOption(parser);
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

function acceptEnumField(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.EnumField | undefined {
  const fieldName = parser.accept(identPattern);
  if (!fieldName) return;
  acceptWhitespace(parser);
  const eq = parser.expect("=");
  acceptWhitespace(parser);
  const fieldNumber = expectSignedIntLit(parser);
  acceptWhitespace(parser);
  const fieldOptions = acceptFieldOptions(parser);
  acceptWhitespace(parser);
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

function expectEnumBody(parser: RecursiveDescentParser): ast.EnumBody {
  const bracketOpen = parser.expect("{");
  type OptionOrEnumFieldOrEmpty = ast.Option | ast.EnumField | ast.Empty;
  const optionOrEnumFieldOrEmpties = acceptStatements<OptionOrEnumFieldOrEmpty>(
    parser,
    [
      acceptOption,
      acceptEnumField,
      acceptEmpty,
    ],
  );
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "enum-body",
    bracketOpen,
    optionOrEnumFieldOrEmpties,
    bracketClose,
  };
}

function acceptEnum(
  parser: RecursiveDescentParser,
  leadingComments: Token[],
): ast.Enum | undefined {
  const keyword = parser.accept("enum");
  if (!keyword) return;
  acceptWhitespace(parser);
  const enumName = parser.expect(identPattern);
  acceptWhitespace(parser);
  const enumBody = expectEnumBody(parser);
  return {
    start: keyword.start,
    end: enumBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "enum",
    keyword,
    enumName,
    enumBody,
  };
}
