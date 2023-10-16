// @ts-nocheck
export declare namespace $.google.protobuf.FeatureSet {
  export type Utf8Validation =
    | "UTF8_VALIDATION_UNKNOWN"
    | "NONE"
    | "VERIFY";
}

export type Type = $.google.protobuf.FeatureSet.Utf8Validation;

export const num2name = {
  0: "UTF8_VALIDATION_UNKNOWN",
  1: "NONE",
  2: "VERIFY",
} as const;

export const name2num = {
  UTF8_VALIDATION_UNKNOWN: 0,
  NONE: 1,
  VERIFY: 2,
} as const;
