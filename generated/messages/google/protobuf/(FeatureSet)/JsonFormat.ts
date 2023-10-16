// @ts-nocheck
export declare namespace $.google.protobuf.FeatureSet {
  export type JsonFormat =
    | "JSON_FORMAT_UNKNOWN"
    | "ALLOW"
    | "LEGACY_BEST_EFFORT";
}

export type Type = $.google.protobuf.FeatureSet.JsonFormat;

export const num2name = {
  0: "JSON_FORMAT_UNKNOWN",
  1: "ALLOW",
  2: "LEGACY_BEST_EFFORT",
} as const;

export const name2num = {
  JSON_FORMAT_UNKNOWN: 0,
  ALLOW: 1,
  LEGACY_BEST_EFFORT: 2,
} as const;
