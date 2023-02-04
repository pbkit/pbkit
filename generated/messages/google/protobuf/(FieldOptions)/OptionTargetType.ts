// @ts-nocheck
export declare namespace $.google.protobuf.FieldOptions {
  export type OptionTargetType =
    | "TARGET_TYPE_UNKNOWN"
    | "TARGET_TYPE_FILE"
    | "TARGET_TYPE_EXTENSION_RANGE"
    | "TARGET_TYPE_MESSAGE"
    | "TARGET_TYPE_FIELD"
    | "TARGET_TYPE_ONEOF"
    | "TARGET_TYPE_ENUM"
    | "TARGET_TYPE_ENUM_ENTRY"
    | "TARGET_TYPE_SERVICE"
    | "TARGET_TYPE_METHOD";
}

export type Type = $.google.protobuf.FieldOptions.OptionTargetType;

export const num2name = {
  0: "TARGET_TYPE_UNKNOWN",
  1: "TARGET_TYPE_FILE",
  2: "TARGET_TYPE_EXTENSION_RANGE",
  3: "TARGET_TYPE_MESSAGE",
  4: "TARGET_TYPE_FIELD",
  5: "TARGET_TYPE_ONEOF",
  6: "TARGET_TYPE_ENUM",
  7: "TARGET_TYPE_ENUM_ENTRY",
  8: "TARGET_TYPE_SERVICE",
  9: "TARGET_TYPE_METHOD",
} as const;

export const name2num = {
  TARGET_TYPE_UNKNOWN: 0,
  TARGET_TYPE_FILE: 1,
  TARGET_TYPE_EXTENSION_RANGE: 2,
  TARGET_TYPE_MESSAGE: 3,
  TARGET_TYPE_FIELD: 4,
  TARGET_TYPE_ONEOF: 5,
  TARGET_TYPE_ENUM: 6,
  TARGET_TYPE_ENUM_ENTRY: 7,
  TARGET_TYPE_SERVICE: 8,
  TARGET_TYPE_METHOD: 9,
} as const;
