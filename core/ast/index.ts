import { Span, Token } from "../parser/recursive-descent-parser.ts";
import {
  Comment,
  Constant,
  Dot,
  Empty,
  FullIdent,
  Keyword,
  Semi,
  StrLit,
} from "./lexical-elements.ts";
import {
  Enum,
  EnumBodyStatement,
  Extend,
  ExtendBodyStatement,
  Message,
  MessageBodyStatement,
  RpcBodyStatement,
  Service,
  ServiceBodyStatement,
} from "./top-level-definitions.ts";

import * as extensionsAndReserved from "./extensions-and-reserved.ts";
import * as fields from "./fields.ts";
import * as lexicalElements from "./lexical-elements.ts";
import * as topLevelDefinitions from "./top-level-definitions.ts";

export * from "./extensions-and-reserved.ts";
export * from "./fields.ts";
export * from "./lexical-elements.ts";
export * from "./top-level-definitions.ts";

export interface Proto {
  statements: TopLevelStatement[];
}

export type Node =
  | index_Node
  | extensionsAndReserved.Node
  | fields.Node
  | lexicalElements.Node
  | topLevelDefinitions.Node;

type index_Node =
  | Syntax
  | Import
  | Package
  | Option
  | OptionName
  | OptionNameSegment;

export type Statement =
  | TopLevelStatement
  | MessageBodyStatement
  | EnumBodyStatement
  | ExtendBodyStatement
  | ServiceBodyStatement
  | RpcBodyStatement;

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
  semi: Semi;
}

export interface Import extends StatementBase {
  type: "import";
  keyword: Keyword;
  weakOrPublic?: Token;
  strLit: StrLit;
  semi: Semi;
}

export interface Package extends StatementBase {
  type: "package";
  keyword: Keyword;
  fullIdent: FullIdent;
  semi: Semi;
}

export interface Option extends StatementBase {
  type: "option";
  keyword: Keyword;
  optionName: OptionName;
  eq: Token;
  constant: Constant;
  semi: Semi;
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
