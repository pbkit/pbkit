import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { Constant, FullIdent, StrLit } from "./lexical-elements.ts";

export interface Proto {
  statements: TopLevelStatement[];
}
export type TopLevelStatement =
  | Syntax
  | Import
  | Package
  | Option
  | TopLevelDef
  | Empty;

export type TopLevelDef = Message | Enum | Extend | Service;

interface StatementBase extends Span {
  leadingComments: Token[];
  trailingComments: Token[];
  leadingDetachedComments: Token[];
}

export interface Syntax extends StatementBase {
  type: "syntax";
  keyword: Token;
  eq: Token;
  quoteStart: Token;
  syntax: Token;
  quoteEnd: Token;
  semi: Token;
}

export interface Import extends StatementBase {
  type: "import";
  keyword: Token;
  weakOrPublic: Token;
  strLit: StrLit;
  semi: Token;
}

export interface Package extends StatementBase {
  type: "package";
  keyword: Token;
  fullIdent: FullIdent;
  semi: Token;
}

export interface Option extends StatementBase {
  type: "option";
  keyword: Token;
  optionName: Token;
  eq: Token;
  constant: Constant;
  semi: Token;
}

export interface Empty extends StatementBase {
  type: "empty";
  semi: Token;
}

export interface Message extends StatementBase {
  type: "message";
  keyword: Token;
  messageName: Token;
  messageBody: unknown; // TODO
}

export interface Enum extends StatementBase {
  type: "enum";
  keyword: Token;
  enumName: Token;
  enumBody: unknown; // TODO
}

export interface Extend extends StatementBase {
  type: "extend";
  keyword: Token;
  messageType: Token;
  extendBody: unknown; // TODO
}

export interface Service extends StatementBase {
  type: "service";
  keyword: Token;
  serviceName: Token;
  serviceBody: unknown; // TODO
}
