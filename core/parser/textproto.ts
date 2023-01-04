import * as ast from "../ast/textproto.ts";
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
} from "./recursive-descent-parser.ts";

export type TextprotoParser = RecursiveDescentParser<TextprotoParserEvent>;
interface TextprotoParserEvent {
  comment: ast.TextprotoComment;
}

const createTextprotoParser = createRecursiveDescentParser as (
  ...args: Parameters<typeof createRecursiveDescentParser>
) => TextprotoParser;

export function parseTextprotoMessage(
  text: string,
): ParseResult<ast.Textproto> {
  const comments: ast.TextprotoComment[] = [];
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
const textprotoCommentPattern = /^#.*(?:\r?\n|$)/;

export function skipWsAndTextprotoComments(parser: TextprotoParser): undefined {
  while (true) {
    const whitespace = parser.accept(whitespacePattern);
    if (whitespace) continue;
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
  return choice([
    skipWsAndTextprotoComments,
    // TODO: TextprotoListValue, TextprotoMessageValue
    acceptTextprotoScalarValue,
  ])(parser)!; // TODO: error
}

function acceptTextprotoFieldName(
  parser: TextprotoParser,
): ast.TextprotoFieldName | undefined {
  const ident = acceptTextprotoIdent(parser);
  if (ident) return ident;
  const loc = parser.loc;
  // TODO
}

const identPattern = /^[a-z_][a-z0-9_]*/i;
const acceptTextprotoIdent = acceptPatternAndThen<ast.TextprotoIdent>(
  identPattern,
  (ident) => ({ type: "textproto-ident", ...ident }),
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

const acceptTextprotoScalarValue = choice<ast.TextprotoScalarValue>([
  acceptTextprotoStrLit,
  acceptTextprotoSignedIdent,
  // TODO
]);
