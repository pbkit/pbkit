import * as ast from "../ast/index.ts";
import {
  createRecursiveDescentParser,
  Pattern,
  RecursiveDescentParser,
  SyntaxError,
  Token,
} from "./recursive-descent-parser.ts";

export interface ParseResult<T = ast.Proto> {
  ast: T;
  parser: RecursiveDescentParser;
}

export function parse(text: string): ParseResult {
  const parser = createRecursiveDescentParser(text);
  const statements = acceptStatements<ast.TopLevelStatement>(parser, [
    acceptSyntax,
    acceptImport,
    acceptPackage,
    acceptOption,
    acceptMessage,
    acceptEnum,
    acceptExtend,
    acceptService,
    acceptEmpty,
  ]);
  const ast: ast.Proto = { statements };
  return { ast, parser };
}

export function parseConstant(text: string): ParseResult<ast.Constant> {
  const parser = createRecursiveDescentParser(text);
  const constant = expectConstant(parser);
  return { ast: constant, parser };
}

interface AcceptFn<T> {
  (parser: RecursiveDescentParser): T | undefined;
}

function acceptPatternAndThen<T>(
  pattern: Pattern,
  then: (token: Token) => T,
): AcceptFn<T> {
  return function accept(parser) {
    const token = parser.accept(pattern);
    if (!token) return;
    return then(token);
  };
}

function choice<T>(acceptFns: AcceptFn<T>[]): AcceptFn<T> {
  return function accept(parser) {
    for (const acceptFn of acceptFns) {
      const node = acceptFn(parser);
      if (node) return node;
    }
  };
}

function many<T>(parser: RecursiveDescentParser, acceptFn: AcceptFn<T>): T[] {
  const nodes: T[] = [];
  let node: ReturnType<typeof acceptFn>;
  while (node = acceptFn(parser)) nodes.push(node);
  return nodes;
}

interface AcceptStatementFn<T extends ast.StatementBase> {
  (
    parser: RecursiveDescentParser,
    leadingComments: ast.Comment[],
  ): T | undefined;
}
function acceptStatements<T extends ast.StatementBase>(
  parser: RecursiveDescentParser,
  acceptStatementFns: AcceptStatementFn<T>[],
) {
  const statements: T[] = [];
  statements:
  while (true) {
    const leadingComments = skipWsAndSweepComments(parser);
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
const intLitPattern = /^0(?:x[0-9a-f]+|[0-7]*)|^[1-9]\d*/i;
const floatLitPattern =
  /^\d+\.\d*(?:e[-+]?\d+)?|^\d+e[-+]?\d+|^\.\d+(?:e[-+]?\d+)?|^inf|^nan/i;
const boolLitPattern = /^true|^false/;
const strLitPattern =
  /^'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\'"]|[^'\0\n\\])*'|^"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\'"]|[^"\0\n\\])*"/i;
const identPattern = /^[a-z_][a-z0-9_]*/i;

const acceptDot = acceptPatternAndThen<ast.Dot>(
  ".",
  (dot) => ({ type: "dot", ...dot }),
);
const acceptComma = acceptPatternAndThen<ast.Comma>(
  ",",
  (comma) => ({ type: "comma", ...comma }),
);
const acceptSemi = acceptPatternAndThen<ast.Semi>(
  ";",
  (semi) => ({ type: "semi", ...semi }),
);
function expectSemi(parser: RecursiveDescentParser): ast.Semi {
  const semi = acceptSemi(parser);
  if (semi) return semi;
  throw new SyntaxError(parser, [";"]);
}
const acceptIdent = acceptPatternAndThen<ast.Ident>(
  identPattern,
  (ident) => ({ type: "ident", ...ident }),
);

function acceptSpecialToken<TType extends string>(
  parser: RecursiveDescentParser,
  type: TType,
  pattern: Pattern = identPattern,
): (Token & { type: TType }) | undefined {
  const token = parser.accept(pattern);
  if (!token) return;
  return { type, ...token };
}

function acceptKeyword(
  parser: RecursiveDescentParser,
  pattern: Pattern = identPattern,
): ast.Keyword | undefined {
  return acceptSpecialToken(parser, "keyword", pattern);
}

function skipWsAndSweepComments(parser: RecursiveDescentParser): ast.Comment[] {
  const result: ast.Comment[] = [];
  while (true) {
    const whitespace = parser.accept(whitespacePattern);
    if (whitespace) continue;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      result.push(multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      result.push(singlelineComment);
      continue;
    }
    break;
  }
  return result;
}

function skipWsAndComments(parser: RecursiveDescentParser): undefined {
  skipWsAndSweepComments(parser);
  return;
}

function acceptFullIdent(
  parser: RecursiveDescentParser,
): ast.FullIdent | undefined {
  const identOrDots = many(
    parser,
    choice<ast.Dot | ast.Ident>([
      acceptDot,
      acceptIdent,
    ]),
  );
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

function acceptType(
  parser: RecursiveDescentParser,
): ast.Type | undefined {
  const identOrDots = many(
    parser,
    choice<ast.Dot | ast.Ident>([
      acceptDot,
      acceptIdent,
    ]),
  );
  if (identOrDots.length < 1) return;
  const first = identOrDots[0];
  const last = identOrDots[identOrDots.length - 1];
  return {
    start: first.start,
    end: last.end,
    type: "type",
    identOrDots,
  };
}

function expectType(parser: RecursiveDescentParser): ast.Type {
  const type = acceptType(parser);
  if (type) return type;
  throw new SyntaxError(parser, [".", identPattern]);
}

function acceptIntLit(parser: RecursiveDescentParser): ast.IntLit | undefined {
  const intLit = parser.accept(intLitPattern);
  if (!intLit) return;
  return { type: "int-lit", ...intLit };
}

function expectIntLit(parser: RecursiveDescentParser): ast.IntLit {
  const intLit = acceptIntLit(parser);
  if (intLit) return intLit;
  throw new SyntaxError(parser, [intLitPattern]);
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
  const tokens = [strLit];
  while (true) {
    skipWsAndComments(parser);
    const strLit = parser.accept(strLitPattern);
    if (!strLit) break;
    tokens.push(strLit);
  }
  const start = tokens[0].start;
  const end = tokens[tokens.length - 1].end;
  return { type: "str-lit", start, end, tokens };
}

function expectStrLit(parser: RecursiveDescentParser): ast.StrLit {
  const strLit = acceptStrLit(parser);
  if (strLit) return strLit;
  throw new SyntaxError(parser, [strLitPattern]);
}

// https://github.com/protocolbuffers/protobuf/blob/c2148566c7/src/google/protobuf/compiler/parser.cc#L1429-L1452
function acceptAggregate(
  parser: RecursiveDescentParser,
): ast.Aggregate | undefined {
  const parenthesisOpen = parser.accept("{");
  if (!parenthesisOpen) return;
  let character = parenthesisOpen;
  let depth = 1;
  while (character = parser.expect(/^(?:\s|\S)/)) {
    switch (character.text) {
      case "{":
        ++depth;
        break;
      case "}":
        --depth;
        break;
    }
    if (depth === 0) {
      break;
    }
  }
  const start = parenthesisOpen.start;
  const end = character.end;
  return { type: "aggregate", start, end };
}

function acceptConstant(
  parser: RecursiveDescentParser,
): ast.Constant | undefined {
  return acceptSignedFloatLit(parser) ?? acceptSignedIntLit(parser) ??
    acceptStrLit(parser) ?? acceptBoolLit(parser) ?? acceptFullIdent(parser) ??
    acceptAggregate(parser);
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
  const optionNameSegmentOrDots = many(
    parser,
    choice<ast.Dot | ast.OptionNameSegment>([
      acceptDot,
      acceptOptionNameSegment,
    ]),
  );
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
  leadingComments: ast.Comment[],
): ast.Syntax | undefined {
  const keyword = acceptKeyword(parser, "syntax");
  if (!keyword) return;
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const quoteOpen = parser.expect(/^['"]/);
  const syntax = parser.expect(/^[^'"]+/);
  const quoteClose = parser.expect(/^['"]/);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
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
  leadingComments: ast.Comment[],
): ast.Import | undefined {
  const keyword = acceptKeyword(parser, "import");
  if (!keyword) return;
  skipWsAndComments(parser);
  const weakOrPublic = parser.accept(/^weak|^public/);
  skipWsAndComments(parser);
  const strLit = expectStrLit(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
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
  leadingComments: ast.Comment[],
): ast.Package | undefined {
  const keyword = acceptKeyword(parser, "package");
  if (!keyword) return;
  skipWsAndComments(parser);
  const fullIdent = expectFullIdent(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
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
  leadingComments: ast.Comment[],
): ast.Option | undefined {
  const keyword = acceptKeyword(parser, /^option\b/);
  if (!keyword) return;
  skipWsAndComments(parser);
  const optionName = expectOptionName(parser);
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const constant = expectConstant(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
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
  leadingComments: ast.Comment[],
): ast.Empty | undefined {
  const semi = acceptSemi(parser);
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
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
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
  const fieldOptionOrCommas = many(
    parser,
    choice<ast.Comma | ast.FieldOption>([
      skipWsAndComments,
      acceptComma,
      acceptFieldOption,
    ]),
  );
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
  leadingComments: ast.Comment[],
): ast.EnumField | undefined {
  const fieldName = parser.accept(identPattern);
  if (!fieldName) return;
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const fieldNumber = expectSignedIntLit(parser);
  skipWsAndComments(parser);
  const fieldOptions = acceptFieldOptions(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
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
  const statements = acceptStatements<ast.EnumBodyStatement>(parser, [
    acceptOption,
    acceptReserved,
    acceptEnumField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "enum-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptEnum(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Enum | undefined {
  const keyword = acceptKeyword(parser, "enum");
  if (!keyword) return;
  skipWsAndComments(parser);
  const enumName = parser.expect(identPattern);
  skipWsAndComments(parser);
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

function acceptField(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Field | undefined {
  const loc = parser.loc;
  const fieldLabel = acceptKeyword(parser, /^required|^optional|^repeated/);
  skipWsAndComments(parser);
  const fieldType = acceptType(parser);
  if (!fieldType) {
    parser.loc = loc;
    return;
  }
  skipWsAndComments(parser);
  const fieldName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const fieldNumber = expectIntLit(parser);
  skipWsAndComments(parser);
  const fieldOptions = acceptFieldOptions(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  return {
    start: (fieldLabel ?? fieldType).start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "field",
    fieldLabel,
    fieldType,
    fieldName,
    eq,
    fieldNumber,
    fieldOptions,
    semi,
  };
}

function acceptOneofField(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.OneofField | undefined {
  const fieldType = acceptType(parser);
  if (!fieldType) return;
  skipWsAndComments(parser);
  const fieldName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const fieldNumber = expectIntLit(parser);
  skipWsAndComments(parser);
  const fieldOptions = acceptFieldOptions(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  return {
    start: fieldType.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "oneof-field",
    fieldType,
    fieldName,
    eq,
    fieldNumber,
    fieldOptions,
    semi,
  };
}

function acceptMapField(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.MapField | undefined {
  const keyword = acceptKeyword(parser, "map");
  if (!keyword) return;
  skipWsAndComments(parser);
  const typeBracketOpen = parser.expect("<");
  skipWsAndComments(parser);
  const keyType = expectType(parser);
  skipWsAndComments(parser);
  const typeSep = parser.expect(",");
  skipWsAndComments(parser);
  const valueType = expectType(parser);
  skipWsAndComments(parser);
  const typeBracketClose = parser.expect(">");
  skipWsAndComments(parser);
  const mapName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const fieldNumber = expectIntLit(parser);
  skipWsAndComments(parser);
  const fieldOptions = acceptFieldOptions(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "map-field",
    keyword,
    typeBracketOpen,
    keyType,
    typeSep,
    valueType,
    typeBracketClose,
    mapName,
    eq,
    fieldNumber,
    fieldOptions,
    semi,
  };
}

function expectOneofBody(parser: RecursiveDescentParser): ast.OneofBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.OneofBodyStatement>(parser, [
    acceptOption,
    acceptOneofField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "oneof-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptOneof(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Oneof | undefined {
  const keyword = acceptKeyword(parser, "oneof");
  if (!keyword) return;
  skipWsAndComments(parser);
  const oneofName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const oneofBody = expectOneofBody(parser);
  return {
    start: keyword.start,
    end: oneofBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "oneof",
    keyword,
    oneofName,
    oneofBody,
  };
}

const acceptMax = acceptPatternAndThen<ast.Max>(
  "max",
  (max) => ({ type: "max", ...max }),
);

function acceptRange(parser: RecursiveDescentParser): ast.Range | undefined {
  const rangeStart = acceptIntLit(parser);
  if (!rangeStart) return;
  skipWsAndComments(parser);
  const to = acceptKeyword(parser, "to");
  if (!to) {
    return {
      start: rangeStart.start,
      end: rangeStart.end,
      type: "range",
      rangeStart,
    };
  }
  skipWsAndComments(parser);
  const rangeEnd = acceptIntLit(parser) ?? acceptMax(parser);
  if (!rangeEnd) throw new SyntaxError(parser, [intLitPattern, "max"]);
  return {
    start: rangeStart.start,
    end: rangeEnd.end,
    type: "range",
    rangeStart,
    to,
    rangeEnd,
  };
}

function expectRanges(parser: RecursiveDescentParser): ast.Ranges {
  const rangeOrCommas = many(
    parser,
    choice<ast.Range | ast.Comma>([
      skipWsAndComments,
      acceptComma,
      acceptRange,
    ]),
  );
  const first = rangeOrCommas[0];
  const last = rangeOrCommas[rangeOrCommas.length - 1];
  return {
    start: first.start,
    end: last.end,
    type: "ranges",
    rangeOrCommas,
  };
}

function acceptExtensions(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Extensions | undefined {
  const keyword = acceptKeyword(parser, "extensions");
  if (!keyword) return;
  skipWsAndComments(parser);
  const ranges = expectRanges(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "extensions",
    keyword,
    ranges,
    semi,
  };
}

function expectFieldNames(parser: RecursiveDescentParser): ast.FieldNames {
  const strLitOrCommas = many(
    parser,
    choice<ast.StrLit | ast.Comma>([
      skipWsAndComments,
      acceptComma,
      acceptStrLit,
    ]),
  );
  const first = strLitOrCommas[0];
  const last = strLitOrCommas[strLitOrCommas.length - 1];
  return {
    start: first.start,
    end: last.end,
    type: "field-names",
    strLitOrCommas,
  };
}

function acceptReserved(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Reserved | undefined {
  const keyword = acceptKeyword(parser, "reserved");
  if (!keyword) return;
  skipWsAndComments(parser);
  const reserved = parser.try(intLitPattern)
    ? expectRanges(parser)
    : expectFieldNames(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  return {
    start: keyword.start,
    end: semi.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "reserved",
    keyword,
    reserved,
    semi,
  };
}

function expectExtendBody(parser: RecursiveDescentParser): ast.ExtendBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.ExtendBodyStatement>(parser, [
    acceptGroup,
    acceptField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "extend-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptExtend(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Extend | undefined {
  const keyword = acceptKeyword(parser, "extend");
  if (!keyword) return;
  skipWsAndComments(parser);
  const messageType = expectType(parser);
  skipWsAndComments(parser);
  const extendBody = expectExtendBody(parser);
  return {
    start: keyword.start,
    end: extendBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "extend",
    keyword,
    messageType,
    extendBody,
  };
}

function acceptGroup(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Group | undefined {
  const loc = parser.loc;
  const groupLabel = acceptKeyword(parser, /^required|^optional|^repeated/);
  if (!groupLabel) {
    parser.loc = loc;
    return;
  }
  skipWsAndComments(parser);
  const keyword = acceptKeyword(parser, "group");
  if (!keyword) {
    parser.loc = loc;
    return;
  }
  skipWsAndComments(parser);
  const groupName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const fieldNumber = expectIntLit(parser);
  skipWsAndComments(parser);
  const messageBody = expectMessageBody(parser);
  return {
    start: groupLabel.start,
    end: messageBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "group",
    groupLabel,
    keyword,
    groupName,
    eq,
    fieldNumber,
    messageBody,
  };
}

function expectMessageBody(parser: RecursiveDescentParser): ast.MessageBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.MessageBodyStatement>(parser, [
    acceptGroup,
    acceptEnum,
    acceptMessage,
    acceptExtend,
    acceptExtensions,
    acceptOption,
    acceptOneof,
    acceptMapField,
    acceptReserved,
    acceptField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "message-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptMessage(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Message | undefined {
  const keyword = acceptKeyword(parser, "message");
  if (!keyword) return;
  skipWsAndComments(parser);
  const messageName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const messageBody = expectMessageBody(parser);
  return {
    start: keyword.start,
    end: messageBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "message",
    keyword,
    messageName,
    messageBody,
  };
}

function expectRpcType(parser: RecursiveDescentParser): ast.RpcType {
  const bracketOpen = parser.expect("(");
  skipWsAndComments(parser);
  const stream = acceptKeyword(parser, "stream");
  skipWsAndComments(parser);
  const messageType = expectType(parser);
  skipWsAndComments(parser);
  const bracketClose = parser.expect(")");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    bracketOpen,
    stream,
    messageType,
    bracketClose,
  };
}

function acceptRpc(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Rpc | undefined {
  const keyword = acceptKeyword(parser, "rpc");
  if (!keyword) return;
  skipWsAndComments(parser);
  const rpcName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const reqType = expectRpcType(parser);
  skipWsAndComments(parser);
  const returns = parser.expect("returns");
  skipWsAndComments(parser);
  const resType = expectRpcType(parser);
  skipWsAndComments(parser);
  const semiOrRpcBody = acceptSemi(parser) ?? expectRpcBody(parser);
  return {
    start: keyword.start,
    end: semiOrRpcBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "rpc",
    keyword,
    rpcName,
    reqType,
    returns,
    resType,
    semiOrRpcBody,
  };
}

function expectRpcBody(parser: RecursiveDescentParser): ast.RpcBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.RpcBodyStatement>(parser, [
    acceptOption,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "rpc-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function expectServiceBody(parser: RecursiveDescentParser): ast.ServiceBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.ServiceBodyStatement>(parser, [
    acceptOption,
    acceptRpc,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    start: bracketOpen.start,
    end: bracketClose.end,
    type: "service-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptService(
  parser: RecursiveDescentParser,
  leadingComments: ast.Comment[],
): ast.Service | undefined {
  const keyword = acceptKeyword(parser, "service");
  if (!keyword) return;
  skipWsAndComments(parser);
  const serviceName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const serviceBody = expectServiceBody(parser);
  return {
    start: keyword.start,
    end: serviceBody.end,
    leadingComments,
    trailingComments: [], // TODO
    leadingDetachedComments: [], // TODO
    type: "service",
    keyword,
    serviceName,
    serviceBody,
  };
}
