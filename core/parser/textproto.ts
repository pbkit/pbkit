import * as ast from "../ast/textproto.ts";
import {
  MultilineComment,
  SinglelineComment,
} from "../ast/lexical-elements.ts";
import {
  AcceptFn,
  acceptPatternAndThen,
  acceptSpecialToken,
  choice,
  many,
  mergeSpans,
} from "./misc.ts";
import { ParseResult } from "./proto.ts";
import {
  createRecursiveDescentParser,
  RecursiveDescentParser,
  Span,
  SyntaxError,
} from "./recursive-descent-parser.ts";

type Comment = ast.TextprotoComment | SinglelineComment | MultilineComment;

export type TextprotoParser = RecursiveDescentParser<TextprotoParserEvent>;
interface TextprotoParserEvent {
  comment: Comment;
}

const createTextprotoParser = createRecursiveDescentParser as (
  ...args: Parameters<typeof createRecursiveDescentParser>
) => TextprotoParser;

export function parseTextprotoMessage(
  text: string,
): ParseResult<ast.Textproto> {
  const comments: Comment[] = [];
  const parser = createTextprotoParser(text);
  parser.on("comment", (comment) => comments.push(comment));
  const statements = acceptTextprotoStatements(parser);
  const ast = { statements };
  return { ast, parser, comments };
}

export function acceptTextprotoStatements(
  parser: TextprotoParser,
): ast.Textproto["statements"] {
  return many(
    parser,
    choice<ast.TextprotoField | ast.TextprotoSemi | ast.TextprotoComma>([
      skipWsAndTextprotoComments,
      acceptTextprotoField,
      acceptTextprotoSemi,
      acceptTextprotoComma,
    ]),
  );
}

const whitespacePattern = /^\s+/;
const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
const textprotoCommentPattern = /^#.*(?:\r?\n|$)/;

export function skipWsAndTextprotoComments(parser: TextprotoParser): undefined {
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
    const textprotoComment = acceptSpecialToken(
      parser,
      "textproto-comment",
      textprotoCommentPattern,
    );
    if (textprotoComment) {
      parser.emit("comment", textprotoComment);
      continue;
    }
    break;
  }
  return;
}

function acceptTextprotoField(
  parser: TextprotoParser,
): ast.TextprotoField | undefined {
  const fieldName = acceptTextprotoFieldName(parser);
  if (!fieldName) return;
  skipWsAndTextprotoComments(parser);
  const colon = parser.accept(":");
  skipWsAndTextprotoComments(parser);
  const value = expectTextprotoFieldValue(parser);
  const semiOrComma = acceptTextprotoSemiOrComma(parser);
  return {
    ...mergeSpans([fieldName, value, semiOrComma]),
    type: "textproto-field",
    fieldName,
    colon,
    value,
    semiOrComma,
  };
}

function expectTextprotoFieldValue(
  parser: TextprotoParser,
): ast.TextprotoField["value"] {
  return choice<ast.TextprotoField["value"]>([
    skipWsAndTextprotoComments,
    // TODO: TextprotoListValue
    acceptTextprotoMessageValue,
    acceptTextprotoScalarValue,
  ])(parser)!; // TODO: error
}

function acceptTextprotoMessageValue(
  parser: TextprotoParser,
): ast.TextprotoMessageValue | undefined {
  const bracketOpen = parser.accept(/^(?:{|<)/);
  if (!bracketOpen) return;
  const statements = acceptTextprotoStatements(parser);
  const bracketClose = bracketOpen.text === "{"
    ? parser.expect("}")
    : parser.expect(">");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "textproto-message-value",
    bracketOpen,
    statements,
    bracketClose,
  };
}

function acceptTextprotoFieldName(
  parser: TextprotoParser,
): ast.TextprotoFieldName | undefined {
  const ident = acceptTextprotoIdent(parser);
  if (ident) return ident;
  const bracketOpen = parser.accept("[");
  if (!bracketOpen) return;
  skipWsAndTextprotoComments(parser);
  const fullIdent1 = expectTextprotoFullIdent(parser);
  skipWsAndTextprotoComments(parser);
  if (parser.try("/")) {
    const slash = parser.expect("/");
    skipWsAndTextprotoComments(parser);
    const fullIdent2 = expectTextprotoFullIdent(parser);
    skipWsAndTextprotoComments(parser);
    const bracketClose = parser.expect("]");
    return {
      ...mergeSpans([bracketOpen, bracketClose]),
      type: "textproto-any-name",
      bracketOpen,
      domain: fullIdent1,
      slash,
      typeName: fullIdent2,
      bracketClose,
    };
  }
  const bracketClose = parser.expect("]");
  return {
    ...mergeSpans([bracketOpen, bracketClose]),
    type: "textproto-extension-name",
    bracketOpen,
    typeName: fullIdent1,
    bracketClose,
  };
}

function acceptTextprotoFullIdent(
  parser: TextprotoParser,
): ast.TextprotoFullIdent | undefined {
  const identOrDots = many(
    parser,
    choice<ast.TextprotoDot | ast.TextprotoIdent>([
      acceptTextprotoDot,
      acceptTextprotoIdent,
    ]),
  );
  if (identOrDots.length < 1) return;
  return {
    ...mergeSpans(identOrDots),
    type: "textproto-full-ident",
    identOrDots,
  };
}

function expectTextprotoFullIdent(
  parser: TextprotoParser,
): ast.TextprotoFullIdent {
  const fullIdent = acceptTextprotoFullIdent(parser);
  if (fullIdent) return fullIdent;
  throw new SyntaxError(parser, [".", identPattern]);
}

const identPattern = /^[a-z_][a-z0-9_]*/i;
const acceptTextprotoIdent = acceptPatternAndThen<ast.TextprotoIdent>(
  identPattern,
  (ident) => ({ type: "textproto-ident", ...ident }),
);

const octPattern = /^0[0-7]+/;
const acceptTextprotoOctLit = acceptPatternAndThen<ast.TextprotoOctLit>(
  octPattern,
  (oct) => ({ type: "textproto-oct-lit", ...oct }),
);

const decPattern = /^(?:0(?=$|[^0-9])|[1-9][0-9]*)/;
const acceptTextprotoDecLit = acceptPatternAndThen<ast.TextprotoDecLit>(
  decPattern,
  (dec) => ({ type: "textproto-dec-lit", ...dec }),
);

// TODO: fix regex
const strLitPattern =
  /^'(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\\?'"]|[^'\0\n\\])*'|^"(?:\\x[0-9a-f]{2}|\\[0-7]{3}|\\[0-7]|\\[abfnrtv\\\?'"]|[^"\0\n\\])*"/i;
function acceptTextprotoStrLit(
  parser: TextprotoParser,
): ast.TextprotoStrLit | undefined {
  const strLit = parser.accept(strLitPattern);
  if (!strLit) return;
  const tokens = [strLit];
  while (true) {
    skipWsAndTextprotoComments(parser);
    const strLit = parser.accept(strLitPattern);
    if (!strLit) break;
    tokens.push(strLit);
  }
  return { ...mergeSpans(tokens), type: "textproto-str-lit", tokens };
}

const acceptTextprotoSemi = acceptPatternAndThen<ast.TextprotoSemi>(
  ";",
  (semi) => ({ type: "textproto-semi", ...semi }),
);

const acceptTextprotoComma = acceptPatternAndThen<ast.TextprotoComma>(
  ",",
  (comma) => ({ type: "textproto-comma", ...comma }),
);

const acceptTextprotoDot = acceptPatternAndThen<ast.TextprotoDot>(
  ".",
  (dot) => ({ type: "textproto-dot", ...dot }),
);

const acceptTextprotoSemiOrComma = choice<
  ast.TextprotoSemi | ast.TextprotoComma
>([
  acceptTextprotoSemi,
  acceptTextprotoComma,
]);

function signed<T extends Span, U extends string, V>(
  acceptFn: AcceptFn<T>,
  type: U,
) {
  return function accept(parser: TextprotoParser): V | undefined {
    const loc = parser.loc;
    const sign = parser.accept("-");
    const value = acceptFn(parser);
    if (!value) {
      parser.loc = loc;
      return;
    }
    return { ...mergeSpans([sign, value]), type, sign, value } as V;
  };
}

const acceptTextprotoSignedIdent = signed<
  ast.TextprotoIdent,
  "textproto-signed-ident",
  ast.TextprotoSignedIdent
>(
  acceptTextprotoIdent,
  "textproto-signed-ident",
);

const acceptTextprotoSignedOctLit = signed<
  ast.TextprotoOctLit,
  "textproto-signed-oct-lit",
  ast.TextprotoSignedOctLit
>(
  acceptTextprotoOctLit,
  "textproto-signed-oct-lit",
);

const acceptTextprotoSignedDecLit = signed<
  ast.TextprotoDecLit,
  "textproto-signed-dec-lit",
  ast.TextprotoSignedDecLit
>(
  acceptTextprotoDecLit,
  "textproto-signed-dec-lit",
);

const acceptTextprotoScalarValue = choice<ast.TextprotoScalarValue>([
  acceptTextprotoStrLit,
  acceptTextprotoSignedIdent,
  acceptTextprotoSignedOctLit,
  acceptTextprotoSignedDecLit,
  // TODO
]);
