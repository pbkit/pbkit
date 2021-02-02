import { Span, Token } from "../parser/recursive-descent-parser.ts";

export interface FullIdent extends Span {
  type: "full-ident";
  identAndDots: (Ident | Dot)[];
}

export interface Ident extends Token {
  type: "ident";
}

export interface Dot extends Token {
  type: "dot";
}

export interface BoolLit extends Token {
  type: "bool-lit";
}

export interface StrLit extends Token {
  type: "str-lit";
}

export interface IntLit extends Token {
  type: "int-lit";
}

export interface SignedIntLit extends Span {
  type: "signed-int-lit";
  sign?: Token;
  value: IntLit;
}

export interface FloatLit extends Token {
  type: "float-lit";
}

export interface SignedFloatLit extends Span {
  type: "signed-float-lit";
  sign?: Token;
  value: FloatLit;
}

export type Constant =
  | FullIdent
  | SignedIntLit
  | SignedFloatLit
  | StrLit
  | BoolLit;
