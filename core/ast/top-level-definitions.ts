import { Span, Token } from "../parser/recursive-descent-parser.ts";
import { Extensions, Reserved } from "./extensions-and-reserved.ts";
import { Field, Group, MapField, Oneof } from "./fields.ts";
import { Option, StatementBase } from "./index.ts";
import { Empty } from "./lexical-elements.ts";

export interface Enum extends StatementBase {
  type: "enum";
  keyword: Token;
  enumName: Token;
  enumBody: unknown; // TODO
}

export interface Message extends StatementBase {
  type: "message";
  keyword: Token;
  messageName: Token;
  messageBody: MessageBody; // TODO
}

export interface MessageBody extends Span {
  type: "message-body";
  bracketOpen: Token;
  statements: MessageBodyStatement[];
  bracketClose: Token;
}

export type MessageBodyStatement =
  | Field
  | Enum
  | Message
  | Extend
  | Extensions
  | Group
  | Option
  | Oneof
  | MapField
  | Reserved
  | Empty;

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
