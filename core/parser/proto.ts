import * as ast from "../ast/index.ts";
import {
  createRecursiveDescentParser,
  Pattern,
  RecursiveDescentParser,
  Span,
  SyntaxError,
  Token,
} from "./recursive-descent-parser.ts";

export interface ParseResult<T = ast.Proto> {
  ast: T;
  parser: ProtoParser;
  comments: ast.Comment[];
}

export type ProtoParser = RecursiveDescentParser<ProtoParserEvent>;
interface ProtoParserEvent {
  comment: ast.Comment;
}

const createProtoParser = createRecursiveDescentParser as (
  ...args: Parameters<typeof createRecursiveDescentParser>
) => ProtoParser;

export function parse(text: string): ParseResult {
  const comments: ast.Comment[] = [];
  const parser = createProtoParser(text);
  parser.on("comment", (comment) => comments.push(comment));
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
  return { ast, parser, comments };
}

export function parseConstant(text: string): ParseResult<ast.Constant> {
  const parser = createProtoParser(text);
  const constant = expectConstant(parser);
  return { ast: constant, parser, comments: [] };
}

function mergeSpans(spans: (undefined | Span | (undefined | Span)[])[]): Span {
  let start = Infinity;
  let end = -Infinity;
  for (let i = 0; i < spans.length; ++i) {
    if (spans[i] == null) continue;
    const span = Array.isArray(spans[i])
      ? mergeSpans(spans[i] as Span[])
      : spans[i] as Span;
    start = Math.min(start, span.start);
    end = Math.max(end, span.end);
  }
  return { start, end };
}

interface AcceptFn<T> {
  (parser: ProtoParser): T | undefined;
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

function many<T>(parser: ProtoParser, acceptFn: AcceptFn<T>): T[] {
  const nodes: T[] = [];
  let node: ReturnType<typeof acceptFn>;
  while (node = acceptFn(parser)) nodes.push(node);
  return nodes;
}

// https://dev.to/svehla/typescript-object-fromentries-389c
type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
type Cast<X, Y> = X extends Y ? X : Y;
type FromEntries<T> = T extends [infer Key, any][]
  ? { [K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, any]>[1] }
  : { [key in string]: any };
type DeepWriteable<T> = T extends Function ? T
  : { -readonly [key in keyof T]: DeepWriteable<T[key]> };
type AcceptComplexSequenceResult<
  T extends Record<string, AcceptFn<any>>,
> = {
  partial: false;
  result: { [key in keyof T]: ReturnType<T[key]> };
} | {
  partial: true;
  result: { [key in keyof T]?: ReturnType<T[key]> };
};
function acceptComplexSequence<
  T extends readonly (readonly [string, AcceptFn<any>])[],
>(
  parser: ProtoParser,
  expectFnSeq: T,
  escapePattern?: Pattern,
): AcceptComplexSequenceResult<FromEntries<DeepWriteable<T>>> {
  const result: any = {};
  let partial = false;
  let hasNewline = false;
  let recoveryPoint: { loc: number; result: any } | undefined;
  for (const [key, expectFn] of expectFnSeq) {
    const loc = parser.loc;
    hasNewline = skipWsAndComments2(parser);
    if (hasNewline && !recoveryPoint) {
      recoveryPoint = { loc: parser.loc, result: { ...result } };
    }
    try {
      result[key] = expectFn(parser);
    } catch {
      parser.loc = loc;
      partial = true;
      if (escapePattern && parser.try(escapePattern)) break;
    }
  }
  if (partial && recoveryPoint) {
    parser.loc = recoveryPoint.loc;
    return { partial, result: recoveryPoint.result };
  }
  return { partial, result };
}

interface AcceptStatementFn<T extends ast.StatementBase> {
  (
    parser: ProtoParser,
    leadingComments: ast.CommentGroup[],
    leadingDetachedComments: ast.CommentGroup[],
  ): T | undefined;
}
function acceptStatements<T extends ast.StatementBase>(
  parser: ProtoParser,
  acceptStatementFns: AcceptStatementFn<T>[],
) {
  const statements: T[] = [];
  statements:
  while (true) {
    const { commentGroups, trailingNewline } = skipWsAndSweepComments(parser);
    let leadingComments: ast.CommentGroup[];
    let leadingDetachedComments: ast.CommentGroup[];
    if (trailingNewline) {
      leadingComments = [];
      leadingDetachedComments = commentGroups;
    } else {
      if (commentGroups.length < 1) {
        leadingComments = [];
        leadingDetachedComments = [];
      } else {
        leadingComments = [commentGroups.pop()!];
        leadingDetachedComments = commentGroups;
      }
    }
    for (const acceptStatementFn of acceptStatementFns) {
      const statement = acceptStatementFn(
        parser,
        leadingComments,
        leadingDetachedComments,
      );
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
const whitespaceWithoutNewlinePattern =
  /^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
const newlinePattern = /^\r?\n/;
const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
const intLitPattern = /^0(?:x[0-9a-f]+|[0-7]*)|^[1-9]\d*/i;
const floatLitPattern =
  /^\d+\.\d*(?:e[-+]?\d+)?|^\d+e[-+]?\d+|^\.\d+(?:e[-+]?\d+)?|^inf|^nan/i;
const boolLitPattern = /^true|^false/;
const strLitPattern =
  /^'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\\?'"]|[^'\0\n\\])*'|^"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\\?'"]|[^"\0\n\\])*"/i;
const identPattern = /^[a-z_][a-z0-9_]*/i;
const messageBodyStatementKeywordPattern =
  /^(?:enum|message|extend|extensions|group|option|oneof|map|reserved)\b/;

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
function expectSemi(parser: ProtoParser): ast.Semi {
  const semi = acceptSemi(parser);
  if (semi) return semi;
  throw new SyntaxError(parser, [";"]);
}
const acceptIdent = acceptPatternAndThen<ast.Ident>(
  identPattern,
  (ident) => ({ type: "ident", ...ident }),
);

function acceptSpecialToken<TType extends string>(
  parser: ProtoParser,
  type: TType,
  pattern: Pattern = identPattern,
): (Token & { type: TType }) | undefined {
  const token = parser.accept(pattern);
  if (!token) return;
  return { type, ...token };
}

function acceptKeyword(
  parser: ProtoParser,
  pattern: Pattern = identPattern,
): ast.Keyword | undefined {
  return acceptSpecialToken(parser, "keyword", pattern);
}

function acceptCommentGroup(
  parser: ProtoParser,
): ast.CommentGroup | undefined {
  const loc = parser.loc;
  const comments: ast.Comment[] = [];
  while (true) {
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      parser.emit("comment", multilineComment);
      comments.push(multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      parser.emit("comment", singlelineComment);
      comments.push(singlelineComment);
      continue;
    }
    break;
  }
  if (comments.length < 1) {
    parser.loc = loc;
    return;
  }
  return {
    ...mergeSpans(comments),
    type: "comment-group",
    comments,
  };
}

function acceptTrailingComments(
  parser: ProtoParser,
): ast.CommentGroup[] {
  const loc = parser.loc;
  const comments: ast.Comment[] = [];
  while (true) {
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const newline = parser.accept(newlinePattern);
    if (newline) break;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      comments.push(multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      comments.push(singlelineComment);
      break;
    }
    break;
  }
  if (comments.length < 1) {
    parser.loc = loc;
    return [];
  }
  return [{
    ...mergeSpans(comments),
    type: "comment-group",
    comments,
  }];
}

interface SkipWsAndSweepCommentsResult {
  commentGroups: ast.CommentGroup[];
  trailingNewline: boolean;
}
function skipWsAndSweepComments(
  parser: ProtoParser,
): SkipWsAndSweepCommentsResult {
  const commentGroups: ast.CommentGroup[] = [];
  let trailingNewline = false;
  parser.accept(whitespacePattern);
  while (true) {
    const commentGroup = acceptCommentGroup(parser);
    if (commentGroup) {
      commentGroups.push(commentGroup);
      trailingNewline = false;
      continue;
    }
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const newline = parser.accept(newlinePattern);
    if (newline) {
      trailingNewline = true;
      continue;
    }
    break;
  }
  return {
    commentGroups,
    trailingNewline,
  };
}

function skipWsAndComments(parser: ProtoParser): undefined {
  while (true) {
    const whitespace = parser.accept(whitespacePattern);
    if (whitespace) continue;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      parser.emit("comment", multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      parser.emit("comment", singlelineComment);
      continue;
    }
    break;
  }
  return;
}

function skipWsAndComments2(parser: ProtoParser): boolean {
  let hasNewline = false;
  while (true) {
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const newline = parser.accept(newlinePattern);
    if (newline) {
      hasNewline = true;
      continue;
    }
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      parser.emit("comment", multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      parser.emit("comment", singlelineComment);
      hasNewline = true;
      continue;
    }
    break;
  }
  return hasNewline;
}

function acceptFullIdent(
  parser: ProtoParser,
): ast.FullIdent | undefined {
  const identOrDots = many(
    parser,
    choice<ast.Dot | ast.Ident>([
      acceptDot,
      acceptIdent,
    ]),
  );
  if (identOrDots.length < 1) return;
  return {
    ...mergeSpans(identOrDots),
    type: "full-ident",
    identOrDots,
  };
}

function expectFullIdent(parser: ProtoParser): ast.FullIdent {
  const fullIdent = acceptFullIdent(parser);
  if (fullIdent) return fullIdent;
  throw new SyntaxError(parser, [".", identPattern]);
}

function acceptType(
  parser: ProtoParser,
): ast.Type | undefined {
  const identOrDots = many(
    parser,
    choice<ast.Dot | ast.Ident>([
      acceptDot,
      acceptIdent,
    ]),
  );
  if (identOrDots.length < 1) return;
  return {
    ...mergeSpans(identOrDots),
    type: "type",
    identOrDots,
  };
}

function expectType(parser: ProtoParser): ast.Type {
  const type = acceptType(parser);
  if (type) return type;
  throw new SyntaxError(parser, [".", identPattern]);
}

function acceptIntLit(parser: ProtoParser): ast.IntLit | undefined {
  const intLit = parser.accept(intLitPattern);
  if (!intLit) return;
  return { type: "int-lit", ...intLit };
}

function expectIntLit(parser: ProtoParser): ast.IntLit {
  const intLit = acceptIntLit(parser);
  if (intLit) return intLit;
  throw new SyntaxError(parser, [intLitPattern]);
}

function acceptSignedIntLit(
  parser: ProtoParser,
): ast.SignedIntLit | undefined {
  const loc = parser.loc;
  const sign = parser.accept("-") ?? parser.accept("+");
  const intLit = acceptIntLit(parser);
  if (!intLit) {
    parser.loc = loc;
    return;
  }
  return {
    ...mergeSpans([sign, intLit]),
    type: "signed-int-lit",
    sign,
    value: intLit,
  };
}

function expectSignedIntLit(parser: ProtoParser): ast.SignedIntLit {
  const signedIntLit = acceptSignedIntLit(parser);
  if (signedIntLit) return signedIntLit;
  throw new SyntaxError(parser, ["-", intLitPattern]);
}

function acceptFloatLit(
  parser: ProtoParser,
): ast.FloatLit | undefined {
  const floatLit = parser.accept(floatLitPattern);
  if (!floatLit) return;
  return { type: "float-lit", ...floatLit };
}

function acceptSignedFloatLit(
  parser: ProtoParser,
): ast.SignedFloatLit | undefined {
  const loc = parser.loc;
  const sign = parser.accept("-") ?? parser.accept("+");
  const floatLit = acceptFloatLit(parser);
  if (!floatLit) {
    parser.loc = loc;
    return;
  }
  return {
    ...mergeSpans([sign, floatLit]),
    type: "signed-float-lit",
    sign,
    value: floatLit,
  };
}

function acceptBoolLit(
  parser: ProtoParser,
): ast.BoolLit | undefined {
  const boolLit = parser.accept(boolLitPattern);
  if (!boolLit) return;
  return { type: "bool-lit", ...boolLit };
}

function acceptStrLit(parser: ProtoParser): ast.StrLit | undefined {
  const strLit = parser.accept(strLitPattern);
  if (!strLit) return;
  const tokens = [strLit];
  while (true) {
    skipWsAndComments(parser);
    const strLit = parser.accept(strLitPattern);
    if (!strLit) break;
    tokens.push(strLit);
  }
  return { ...mergeSpans(tokens), type: "str-lit", tokens };
}

function expectStrLit(parser: ProtoParser): ast.StrLit {
  const strLit = acceptStrLit(parser);
  if (strLit) return strLit;
  throw new SyntaxError(parser, [strLitPattern]);
}

// https://github.com/protocolbuffers/protobuf/blob/c2148566c7/src/google/protobuf/compiler/parser.cc#L1429-L1452
function acceptAggregate(
  parser: ProtoParser,
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
  return {
    ...mergeSpans([parenthesisOpen, character]),
    type: "aggregate",
  };
}

function acceptConstant(
  parser: ProtoParser,
): ast.Constant | undefined {
  return acceptSignedFloatLit(parser) ?? acceptSignedIntLit(parser) ??
    acceptStrLit(parser) ?? acceptBoolLit(parser) ?? acceptFullIdent(parser) ??
    acceptAggregate(parser);
}

function expectConstant(parser: ProtoParser): ast.Constant {
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
  parser: ProtoParser,
): ast.OptionNameSegment | undefined {
  const bracketOpen = parser.accept("(");
  const name = acceptFullIdent(parser);
  if (!name) {
    if (bracketOpen) throw new SyntaxError(parser, [identPattern]);
    return;
  }
  const bracketClose = parser[bracketOpen ? "expect" : "accept"](")");
  return {
    ...mergeSpans([bracketOpen, name, bracketClose]),
    type: "option-name-segment",
    bracketOpen,
    name,
    bracketClose,
  };
}

function acceptOptionName(
  parser: ProtoParser,
): ast.OptionName | undefined {
  const optionNameSegmentOrDots = many(
    parser,
    choice<ast.Dot | ast.OptionNameSegment>([
      acceptDot,
      acceptOptionNameSegment,
    ]),
  );
  if (optionNameSegmentOrDots.length < 1) return;
  return {
    ...mergeSpans(optionNameSegmentOrDots),
    type: "option-name",
    optionNameSegmentOrDots,
  };
}

function expectOptionName(parser: ProtoParser): ast.OptionName {
  const optionName = acceptOptionName(parser);
  if (optionName) return optionName;
  throw new SyntaxError(parser, ["(", identPattern]);
}

function acceptSyntax(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
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
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Import | undefined {
  const keyword = acceptKeyword(parser, "import");
  if (!keyword) return;
  skipWsAndComments(parser);
  const weakOrPublic = parser.accept(/^weak|^public/);
  skipWsAndComments(parser);
  const strLit = expectStrLit(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "import",
    keyword,
    weakOrPublic,
    strLit,
    semi,
  };
}

function acceptPackage(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Package | undefined {
  const keyword = acceptKeyword(parser, "package");
  if (!keyword) return;
  skipWsAndComments(parser);
  const fullIdent = expectFullIdent(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "package",
    keyword,
    fullIdent,
    semi,
  };
}

function acceptOption(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "option",
    keyword,
    optionName,
    eq,
    constant,
    semi,
  };
}

function acceptEmpty(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Empty | undefined {
  const semi = acceptSemi(parser);
  if (!semi) return;
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "empty",
    semi,
  };
}

function acceptFieldOption(
  parser: ProtoParser,
): ast.FieldOption | undefined {
  const optionName = acceptOptionName(parser);
  if (!optionName) return;
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const constant = expectConstant(parser);
  return {
    ...mergeSpans([optionName, constant]),
    type: "field-option",
    optionName,
    eq,
    constant,
  };
}

function acceptFieldOptions(
  parser: ProtoParser,
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
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "field-options",
    bracketOpen,
    fieldOptionOrCommas,
    bracketClose,
  };
}

function acceptEnumField(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      fieldName,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "enum-field",
    fieldName,
    eq,
    fieldNumber,
    fieldOptions,
    semi,
  };
}

function expectEnumBody(parser: ProtoParser): ast.EnumBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.EnumBodyStatement>(parser, [
    acceptOption,
    acceptReserved,
    acceptEnumField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "enum-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptEnum(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Enum | undefined {
  const keyword = acceptKeyword(parser, "enum");
  if (!keyword) return;
  skipWsAndComments(parser);
  const enumName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const enumBody = expectEnumBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      enumBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "enum",
    keyword,
    enumName,
    enumBody,
  };
}

function acceptField(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Field | ast.MalformedField | undefined {
  const loc = parser.loc;
  const fieldLabel = acceptKeyword(parser, /^required|^optional|^repeated/);
  skipWsAndComments(parser);
  const fieldType = acceptType(parser);
  if (!fieldType) {
    parser.loc = loc;
    return;
  }
  const rest = acceptComplexSequence(
    parser,
    [
      ["fieldName", (parser) => parser.expect(identPattern)],
      ["eq", (parser) => parser.expect("=")],
      ["fieldNumber", expectIntLit],
      ["fieldOptions", acceptFieldOptions],
      ["semi", expectSemi],
    ] as const,
    messageBodyStatementKeywordPattern,
  );
  const trailingComments = rest.result.semi
    ? acceptTrailingComments(parser)
    : [];
  const type = rest.partial ? "malformed-field" : "field";
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      fieldLabel,
      fieldType,
      Object.values(rest.result),
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: type as any,
    fieldLabel,
    fieldType,
    ...rest.result,
  };
}

function acceptOneofField(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      fieldType,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
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
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
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

function expectOneofBody(parser: ProtoParser): ast.OneofBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.OneofBodyStatement>(parser, [
    acceptOneofGroup,
    acceptOption,
    acceptOneofField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "oneof-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptOneof(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Oneof | undefined {
  const keyword = acceptKeyword(parser, "oneof");
  if (!keyword) return;
  skipWsAndComments(parser);
  const oneofName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const oneofBody = expectOneofBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      oneofBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
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

function acceptRange(parser: ProtoParser): ast.Range | undefined {
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
    ...mergeSpans([rangeStart, rangeEnd]),
    type: "range",
    rangeStart,
    to,
    rangeEnd,
  };
}

function expectRanges(parser: ProtoParser): ast.Ranges {
  const rangeOrCommas = many(
    parser,
    choice<ast.Range | ast.Comma>([
      skipWsAndComments,
      acceptComma,
      acceptRange,
    ]),
  );
  return {
    ...mergeSpans(rangeOrCommas),
    type: "ranges",
    rangeOrCommas,
  };
}

function acceptExtensions(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Extensions | undefined {
  const keyword = acceptKeyword(parser, "extensions");
  if (!keyword) return;
  skipWsAndComments(parser);
  const ranges = expectRanges(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "extensions",
    keyword,
    ranges,
    semi,
  };
}

function expectFieldNames(parser: ProtoParser): ast.FieldNames {
  const strLitOrCommas = many(
    parser,
    choice<ast.StrLit | ast.Comma>([
      skipWsAndComments,
      acceptComma,
      acceptStrLit,
    ]),
  );
  return {
    ...mergeSpans(strLitOrCommas),
    type: "field-names",
    strLitOrCommas,
  };
}

function acceptReserved(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Reserved | undefined {
  const keyword = acceptKeyword(parser, "reserved");
  if (!keyword) return;
  skipWsAndComments(parser);
  const reserved = parser.try(intLitPattern)
    ? expectRanges(parser)
    : expectFieldNames(parser);
  skipWsAndComments(parser);
  const semi = expectSemi(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semi,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "reserved",
    keyword,
    reserved,
    semi,
  };
}

function expectExtendBody(parser: ProtoParser): ast.ExtendBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.ExtendBodyStatement>(parser, [
    acceptGroup,
    acceptField,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "extend-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptExtend(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Extend | undefined {
  const keyword = acceptKeyword(parser, "extend");
  if (!keyword) return;
  skipWsAndComments(parser);
  const messageType = expectType(parser);
  skipWsAndComments(parser);
  const extendBody = expectExtendBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      extendBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "extend",
    keyword,
    messageType,
    extendBody,
  };
}

function acceptGroup(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const fieldOptions = acceptFieldOptions(parser);
  skipWsAndComments(parser);
  const messageBody = expectMessageBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      groupLabel,
      messageBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "group",
    groupLabel,
    keyword,
    groupName,
    eq,
    fieldNumber,
    fieldOptions,
    messageBody,
  };
}

function acceptOneofGroup(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.OneofGroup | undefined {
  const keyword = acceptKeyword(parser, "group");
  if (!keyword) return;
  skipWsAndComments(parser);
  const groupName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const eq = parser.expect("=");
  skipWsAndComments(parser);
  const fieldNumber = expectIntLit(parser);
  skipWsAndComments(parser);
  const messageBody = expectMessageBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      messageBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "oneof-group",
    keyword,
    groupName,
    eq,
    fieldNumber,
    messageBody,
  };
}

function expectMessageBody(parser: ProtoParser): ast.MessageBody {
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
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "message-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptMessage(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Message | undefined {
  const keyword = acceptKeyword(parser, "message");
  if (!keyword) return;
  skipWsAndComments(parser);
  const messageName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const messageBody = expectMessageBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      messageBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "message",
    keyword,
    messageName,
    messageBody,
  };
}

function expectRpcType(parser: ProtoParser): ast.RpcType {
  const bracketOpen = parser.expect("(");
  skipWsAndComments(parser);
  const stream = acceptKeyword(parser, "stream");
  skipWsAndComments(parser);
  const messageType = expectType(parser);
  skipWsAndComments(parser);
  const bracketClose = parser.expect(")");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    bracketOpen,
    stream,
    messageType,
    bracketClose,
  };
}

function acceptRpc(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
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
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      semiOrRpcBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "rpc",
    keyword,
    rpcName,
    reqType,
    returns,
    resType,
    semiOrRpcBody,
  };
}

function expectRpcBody(parser: ProtoParser): ast.RpcBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.RpcBodyStatement>(parser, [
    acceptOption,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "rpc-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function expectServiceBody(parser: ProtoParser): ast.ServiceBody {
  const bracketOpen = parser.expect("{");
  const statements = acceptStatements<ast.ServiceBodyStatement>(parser, [
    acceptOption,
    acceptRpc,
    acceptEmpty,
  ]);
  const bracketClose = parser.expect("}");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "service-body",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptService(
  parser: ProtoParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Service | undefined {
  const keyword = acceptKeyword(parser, "service");
  if (!keyword) return;
  skipWsAndComments(parser);
  const serviceName = parser.expect(identPattern);
  skipWsAndComments(parser);
  const serviceBody = expectServiceBody(parser);
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      leadingDetachedComments,
      leadingComments,
      keyword,
      serviceBody,
      trailingComments,
    ]),
    leadingComments,
    trailingComments,
    leadingDetachedComments,
    type: "service",
    keyword,
    serviceName,
    serviceBody,
  };
}
