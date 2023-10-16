// @ts-nocheck
export declare namespace $.google.protobuf.FeatureSet {
  export type EnumType =
    | "ENUM_TYPE_UNKNOWN"
    | "OPEN"
    | "CLOSED";
}

export type Type = $.google.protobuf.FeatureSet.EnumType;

export const num2name = {
  0: "ENUM_TYPE_UNKNOWN",
  1: "OPEN",
  2: "CLOSED",
} as const;

export const name2num = {
  ENUM_TYPE_UNKNOWN: 0,
  OPEN: 1,
  CLOSED: 2,
} as const;
