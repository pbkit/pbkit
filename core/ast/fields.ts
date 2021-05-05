import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { Option, OptionName, StatementBase } from "./index.ts";
import {
  Comma,
  Constant,
  Empty,
  Keyword,
  Semi,
  Type,
} from "./lexical-elements.ts";
import { MessageBody } from "./top-level-definitions.ts";

export interface Field extends StatementBase {
  type: "field";
  fieldLabel?: Keyword;
  fieldType: Type;
  fieldName: Token;
  eq: Token;
  fieldNumber: Token;
  fieldOptions?: FieldOptions;
  semi: Semi;
}

export interface FieldOptions extends Span {
  type: "field-options";
  bracketOpen: Token;
  fieldOptionOrCommas: (FieldOption | Comma)[];
  bracketClose: Token;
}

export interface FieldOption extends Span {
  type: "field-option";
  optionName: OptionName;
  eq: Token;
  constant: Constant;
}

export interface Group extends StatementBase {
  type: "group";
  groupLabel: Keyword;
  keyword: Keyword;
  groupName: Token;
  eq: Token;
  fieldNumber: Token;
  messageBody: MessageBody;
}

export interface Oneof extends StatementBase {
  type: "oneof";
  keyword: Keyword;
  oneofName: Token;
  oneofBody: OneofBody;
}

export interface OneofBody extends Span {
  type: "oneof-body";
  bracketOpen: Token;
  statements: OneofBodyStatement[];
  bracketClose: Token;
}

export type OneofBodyStatement =
  | Option
  | OneofField
  | Empty;

export interface OneofField extends StatementBase {
  type: "oneof-field";
  fieldType: Type;
  fieldName: Token;
  eq: Token;
  fieldNumber: Token;
  fieldOptions?: FieldOptions;
  semi: Semi;
}

export interface MapField extends StatementBase {
  type: "map-field";
  keyword: Keyword;
  typeBracketOpen: Token;
  keyType: Type;
  typeSep: Token;
  valueType: Type;
  typeBracketClose: Token;
  mapName: Token;
  eq: Token;
  fieldNumber: Token;
  fieldOptions?: FieldOptions;
  semi: Semi;
}
