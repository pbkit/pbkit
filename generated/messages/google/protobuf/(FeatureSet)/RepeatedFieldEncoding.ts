// @ts-nocheck
export declare namespace $.google.protobuf.FeatureSet {
  export type RepeatedFieldEncoding =
    | "REPEATED_FIELD_ENCODING_UNKNOWN"
    | "PACKED"
    | "EXPANDED";
}

export type Type = $.google.protobuf.FeatureSet.RepeatedFieldEncoding;

export const num2name = {
  0: "REPEATED_FIELD_ENCODING_UNKNOWN",
  1: "PACKED",
  2: "EXPANDED",
} as const;

export const name2num = {
  REPEATED_FIELD_ENCODING_UNKNOWN: 0,
  PACKED: 1,
  EXPANDED: 2,
} as const;
