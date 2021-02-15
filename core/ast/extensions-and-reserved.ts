import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { StatementBase } from "./index.ts";
import { Comma, IntLit, StrLit } from "./lexical-elements.ts";

export interface Extensions extends StatementBase {
  type: "extensions";
  keyword: Token;
  ranges: Ranges;
  semi: Token;
}

export interface Ranges extends Span {
  type: "ranges";
  rangeOrCommas: (Range | Comma)[];
}

export interface Range extends Span {
  type: "range";
  rangeStart: IntLit;
  to?: Token;
  rangeEnd?: IntLit | Max;
}

export interface Max extends Token {
  type: "max";
}

export interface Reserved extends StatementBase {
  type: "reserved";
  keyword: Token;
  reserved: Ranges | FieldNames;
  semi: Token;
}

export interface FieldNames extends Span {
  type: "field-names";
  strLitOrCommas: (StrLit | Comma)[];
}
