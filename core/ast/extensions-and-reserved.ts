import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { FieldOptions, StatementBase } from "./index.ts";
import {
  Comma,
  Keyword,
  Semi,
  SignedIntLit,
  StrLit,
} from "./lexical-elements.ts";

export type Node =
  | Extensions
  | Ranges
  | Range
  | Max
  | Reserved
  | FieldNames;

export interface Extensions extends StatementBase {
  type: "extensions";
  keyword: Keyword;
  ranges: Ranges;
  fieldOptions?: FieldOptions;
  semi: Semi;
}

export interface Ranges extends Span {
  type: "ranges";
  rangeOrCommas: (Range | Comma)[];
}

export interface Range extends Span {
  type: "range";
  rangeStart: SignedIntLit;
  to?: Keyword;
  rangeEnd?: SignedIntLit | Max;
}

export interface Max extends Token {
  type: "max";
}

export interface Reserved extends StatementBase {
  type: "reserved";
  keyword: Keyword;
  reserved: Ranges | FieldNames;
  semi: Semi;
}

export interface FieldNames extends Span {
  type: "field-names";
  strLitOrCommas: (StrLit | Comma)[];
}
