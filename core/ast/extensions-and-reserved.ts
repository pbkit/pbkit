import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { StatementBase } from "./index.ts";
import { Comma, IntLit, Keyword, StrLit } from "./lexical-elements.ts";

export interface Extensions extends StatementBase {
  type: "extensions";
  keyword: Keyword;
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
  to?: Keyword;
  rangeEnd?: IntLit | Max;
}

export interface Max extends Token {
  type: "max";
}

export interface Reserved extends StatementBase {
  type: "reserved";
  keyword: Keyword;
  reserved: Ranges | FieldNames;
  semi: Token;
}

export interface FieldNames extends Span {
  type: "field-names";
  strLitOrCommas: (StrLit | Comma)[];
}
