import { Span, Token } from "../parser/recursive-descent-parser.ts";
import {
  Comment,
  Constant,
  Dot,
  Empty,
  FullIdent,
  Keyword,
} from "./lexical-elements.ts";
import { Enum, Extend, Message, Service } from "./top-level-definitions.ts";

export * from "./extensions-and-reserved.ts";
export * from "./fields.ts";
export * from "./lexical-elements.ts";
export * from "./top-level-definitions.ts";

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

export interface StatementBase extends Span {
  leadingComments: Comment[];
  trailingComments: Comment[];
  leadingDetachedComments: Comment[];
}

export interface Syntax extends StatementBase {
  type: "syntax";
  keyword: Keyword;
  eq: Token;
  quoteOpen: Token;
  syntax: Token;
  quoteClose: Token;
  semi: Token;
}

export interface Import extends StatementBase {
  type: "import";
  keyword: Keyword;
  weakOrPublic?: Token;
  strLit: Token;
  semi: Token;
}

export interface Package extends StatementBase {
  type: "package";
  keyword: Keyword;
  fullIdent: FullIdent;
  semi: Token;
}

export interface Option extends StatementBase {
  type: "option";
  keyword: Keyword;
  optionName: OptionName;
  eq: Token;
  constant: Constant;
  semi: Token;
}

export interface OptionName extends Span {
  type: "option-name";
  optionNameSegmentOrDots: (OptionNameSegment | Dot)[];
}

export interface OptionNameSegment extends Span {
  type: "option-name-segment";
  bracketOpen?: Token;
  name: FullIdent;
  bracketClose?: Token;
}
