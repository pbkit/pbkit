import { StatementBase } from "./index.ts";
import { Span, Token } from "../parser/recursive-descent-parser.ts";

export type Comment = SinglelineComment | MultilineComment;

export interface SinglelineComment extends Token {
  type: "singleline-comment";
}

export interface MultilineComment extends Token {
  type: "multiline-comment";
}

export interface Keyword extends Token {
  type: "keyword";
}

export interface Type extends Span {
  type: "type";
  identOrDots: (Ident | Dot)[];
}

export interface FullIdent extends Span {
  type: "full-ident";
  identOrDots: (Ident | Dot)[];
}

export interface Ident extends Token {
  type: "ident";
}

export interface Dot extends Token {
  type: "dot";
}

export interface Comma extends Token {
  type: "comma";
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

export interface BoolLit extends Token {
  type: "bool-lit";
}

export interface StrLit extends Token {
  type: "str-lit";
}

export interface Aggregate extends Span {
  type: "aggregate";
}

export interface Empty extends StatementBase {
  type: "empty";
  semi: Token;
}

export type Constant =
  | FullIdent
  | SignedIntLit
  | SignedFloatLit
  | StrLit
  | BoolLit
  | Aggregate;
