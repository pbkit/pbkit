// @ts-nocheck
export declare namespace $.google.protobuf.FeatureSet {
  export type MessageEncoding =
    | "MESSAGE_ENCODING_UNKNOWN"
    | "LENGTH_PREFIXED"
    | "DELIMITED";
}

export type Type = $.google.protobuf.FeatureSet.MessageEncoding;

export const num2name = {
  0: "MESSAGE_ENCODING_UNKNOWN",
  1: "LENGTH_PREFIXED",
  2: "DELIMITED",
} as const;

export const name2num = {
  MESSAGE_ENCODING_UNKNOWN: 0,
  LENGTH_PREFIXED: 1,
  DELIMITED: 2,
} as const;
