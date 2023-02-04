// @ts-nocheck
export declare namespace $.google.protobuf.FieldOptions {
  export type OptionRetention =
    | "RETENTION_UNKNOWN"
    | "RETENTION_RUNTIME"
    | "RETENTION_SOURCE";
}

export type Type = $.google.protobuf.FieldOptions.OptionRetention;

export const num2name = {
  0: "RETENTION_UNKNOWN",
  1: "RETENTION_RUNTIME",
  2: "RETENTION_SOURCE",
} as const;

export const name2num = {
  RETENTION_UNKNOWN: 0,
  RETENTION_RUNTIME: 1,
  RETENTION_SOURCE: 2,
} as const;
