// @ts-nocheck
export declare namespace $.google.protobuf.ExtensionRangeOptions {
  export type VerificationState =
    | "DECLARATION"
    | "UNVERIFIED";
}

export type Type = $.google.protobuf.ExtensionRangeOptions.VerificationState;

export const num2name = {
  0: "DECLARATION",
  1: "UNVERIFIED",
} as const;

export const name2num = {
  DECLARATION: 0,
  UNVERIFIED: 1,
} as const;
