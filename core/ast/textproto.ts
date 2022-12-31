import { Span, Token } from "../parser/recursive-descent-parser.ts";

export type Node =
  | TextprotoComment
  | TextprotoMessage
  | TextprotoField
  | TextprotoSemi
  | TextprotoComma
  | TextprotoDot
  | TextprotoFullIdent
  | TextprotoExtensionName
  | TextprotoAnyName
  | TextprotoListValue
  | TextprotoMessageValue
  | TextprotoStrLit
  | TextprotoIdent
  | TextprotoFloatLit
  | TextprotoDecLit
  | TextprotoOctLit
  | TextprotoHexLit
  | TextprotoSignedIdent
  | TextprotoSignedFloatLit
  | TextprotoSignedDecLit
  | TextprotoSignedOctLit
  | TextprotoSignedHexLit;

export interface TextprotoComment extends Token {
  type: "textproto-comment";
}

export interface TextprotoMessage extends Span {
  type: "textproto-message";
  statements: TextprotoMessageStatement[];
}

export type TextprotoMessageStatement =
  | TextprotoField
  | TextprotoSemi
  | TextprotoComma;

export interface TextprotoField extends Span {
  fieldName: TextprotoFieldName;
  colon?: Token;
  value: TextprotoListValue | TextprotoMessageValue | TextprotoScalarValue;
  semiOrComma?: TextprotoSemi | TextprotoComma;
}

export interface TextprotoSemi extends Token {
  type: "textproto-semi";
}

export interface TextprotoComma extends Token {
  type: "textproto-comma";
}

export interface TextprotoDot extends Token {
  type: "textproto-dot";
}

export interface TextprotoFullIdent extends Span {
  type: "textproto-full-ident";
  identOrDots: (TextprotoIdent | TextprotoDot)[];
}

export type TextprotoFieldName =
  | TextprotoExtensionName
  | TextprotoAnyName
  | TextprotoIdent;

export interface TextprotoExtensionName extends Span {
  type: "textproto-extension-name";
  bracketOpen: Token;
  typeName: TextprotoFullIdent;
  bracketClose: Token;
}

export interface TextprotoAnyName extends Span {
  type: "textproto-any-name";
  bracketOpen: Token;
  domain: TextprotoFullIdent;
  slash: Token;
  typeName: TextprotoFullIdent;
  bracketClose: Token;
}

export interface TextprotoListValue extends Span {
  bracketOpen: Token;
  valueOrCommas: (
    | TextprotoMessageValue
    | TextprotoScalarValue
    | TextprotoComma
  )[];
  bracketClose: Token;
}

export interface TextprotoMessageValue extends Span {
  type: "textproto-message-value";
  bracketOpen: Token;
  message: TextprotoMessage;
  bracketClose: Token;
}

export type TextprotoScalarValue =
  | TextprotoSignedIdent
  | TextprotoSignedFloatLit
  | TextprotoSignedDecLit
  | TextprotoSignedOctLit
  | TextprotoSignedHexLit;

export interface TextprotoStrLit extends Span {
  type: "textproto-str-lit";
  tokens: Token[];
}

export interface TextprotoIdent extends Token {
  type: "textproto-ident";
}

export interface TextprotoFloatLit extends Token {
  type: "textproto-float-lit";
}

export interface TextprotoDecLit extends Token {
  type: "textproto-dec-lit";
}

export interface TextprotoOctLit extends Token {
  type: "textproto-oct-lit";
}

export interface TextprotoHexLit extends Token {
  type: "textproto-hex-lit";
}

export interface TextprotoSignedIdent extends Span {
  type: "textproto-signed-ident";
  sign?: Token;
  value: TextprotoIdent;
}

export interface TextprotoSignedFloatLit extends Span {
  type: "textproto-signed-float-lit";
  sign?: Token;
  value: TextprotoFloatLit;
}

export interface TextprotoSignedDecLit extends Span {
  type: "textproto-signed-dec-lit";
  sign?: Token;
  value: TextprotoDecLit;
}

export interface TextprotoSignedOctLit extends Span {
  type: "textproto-signed-oct-lit";
  sign?: Token;
  value: TextprotoOctLit;
}

export interface TextprotoSignedHexLit extends Span {
  type: "textproto-signed-hex-lit";
  sign?: Token;
  value: TextprotoHexLit;
}
