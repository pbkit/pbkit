// @ts-nocheck
export declare namespace $.google.protobuf.FeatureSet {
  export type FieldPresence =
    | "FIELD_PRESENCE_UNKNOWN"
    | "EXPLICIT"
    | "IMPLICIT"
    | "LEGACY_REQUIRED";
}

export type Type = $.google.protobuf.FeatureSet.FieldPresence;

export const num2name = {
  0: "FIELD_PRESENCE_UNKNOWN",
  1: "EXPLICIT",
  2: "IMPLICIT",
  3: "LEGACY_REQUIRED",
} as const;

export const name2num = {
  FIELD_PRESENCE_UNKNOWN: 0,
  EXPLICIT: 1,
  IMPLICIT: 2,
  LEGACY_REQUIRED: 3,
} as const;
