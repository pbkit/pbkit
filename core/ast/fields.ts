import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { StatementBase } from "./index.ts";
import { Comma, Constant, Type } from "./lexical-elements.ts";
import { MessageBody } from "./top-level-definitions.ts";

export interface Field extends StatementBase {
  type: "field";
  fieldLabel: Token;
  fieldType: Type;
  fieldName: Token;
  eq: Token;
  fieldNumber: Token;
  fieldOptions?: FieldOptions;
  semi: Token;
}

export interface FieldOptions extends Span {
  type: "field-options";
  bracketOpen: Token;
  fieldOptionOrCommas: (FieldOption | Comma)[];
  bracketClose: Token;
}

export interface FieldOption extends Span {
  type: "field-option";
  optionName: Token;
  eq: Token;
  constant: Constant;
}

export interface Group extends StatementBase {
  type: "group";
  groupLabel: Token;
  keyword: Token;
  groupName: Token;
  eq: Token;
  fieldNumber: Token;
  messageBody: MessageBody;
}

export interface Oneof extends StatementBase {
  type: "oneof";
  keyword: Token;
  oneofName: Token;
  oneofBody: OneofBody;
}

export interface OneofBody extends Span {
  type: "oneof-body";
  bracketOpen: Token;
  fieldOptionOrCommas: (FieldOption | Comma)[];
  bracketClose: Token;
}

export interface OneofField extends StatementBase {
  type: "oneof-field";
  fieldType: Type;
  fieldName: Token;
  eq: Token;
  fieldNumber: Token;
  fieldOptions?: FieldOptions;
  semi: Token;
}

export interface MapField extends StatementBase {
  type: "map-field";
  keyword: Token;
  typeBracketOpen: Token;
  keyType: Type;
  typeSep: Token;
  valueType: Type;
  typeBracketClose: Token;
  mapName: Token;
  eq: Token;
  fieldNumber: Token;
  fieldOptions?: FieldOptions;
  semi: Token;
}
