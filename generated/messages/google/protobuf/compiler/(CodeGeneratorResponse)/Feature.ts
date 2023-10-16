// @ts-nocheck
export declare namespace $.google.protobuf.compiler.CodeGeneratorResponse {
  export type Feature =
    | "FEATURE_NONE"
    | "FEATURE_PROTO3_OPTIONAL"
    | "FEATURE_SUPPORTS_EDITIONS";
}

export type Type = $.google.protobuf.compiler.CodeGeneratorResponse.Feature;

export const num2name = {
  0: "FEATURE_NONE",
  1: "FEATURE_PROTO3_OPTIONAL",
  2: "FEATURE_SUPPORTS_EDITIONS",
} as const;

export const name2num = {
  FEATURE_NONE: 0,
  FEATURE_PROTO3_OPTIONAL: 1,
  FEATURE_SUPPORTS_EDITIONS: 2,
} as const;
