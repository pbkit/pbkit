import { StatementBase } from "./index.ts";
import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { TextprotoMessageStatement } from "./textproto.ts";

export type Node =
  | CommentGroup
  | SinglelineComment
  | MultilineComment
  | Keyword
  | Type
  | FullIdent
  | Ident
  | Dot
  | Comma
  | Semi
  | IntLit
  | SignedIntLit
  | FloatLit
  | SignedFloatLit
  | BoolLit
  | StrLit
  | Aggregate
  | Empty;

export interface CommentGroup extends Span {
  type: "comment-group";
  comments: Comment[];
}

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

export interface Semi extends Token {
  type: "semi";
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

export interface StrLit extends Span {
  type: "str-lit";
  tokens: Token[];
}

export interface Aggregate extends Span {
  type: "aggregate";
  bracketOpen: Token;
  statements: TextprotoMessageStatement[];
  bracketClose: Token;
}

export interface Empty extends StatementBase {
  type: "empty";
  semi: Semi;
}

export type Constant =
  | FullIdent
  | SignedIntLit
  | SignedFloatLit
  | StrLit
  | BoolLit
  | Aggregate;
