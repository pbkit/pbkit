export declare namespace $.google.protobuf.FieldOptions {
  export type JSType =
    | "JS_NORMAL"
    | "JS_STRING"
    | "JS_NUMBER";
}
export type Type = $.google.protobuf.FieldOptions.JSType;

export const num2name = {
  0: "JS_NORMAL",
  1: "JS_STRING",
  2: "JS_NUMBER",
} as const;

export const name2num = {
  JS_NORMAL: 0,
  JS_STRING: 1,
  JS_NUMBER: 2,
} as const;
