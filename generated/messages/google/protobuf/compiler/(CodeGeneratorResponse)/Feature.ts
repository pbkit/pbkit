export declare namespace $.google.protobuf.compiler.CodeGeneratorResponse {
  export type Feature =
    | "FEATURE_NONE"
    | "FEATURE_PROTO3_OPTIONAL";
}
export type Type = $.google.protobuf.compiler.CodeGeneratorResponse.Feature;

export const num2name = {
  0: "FEATURE_NONE",
  1: "FEATURE_PROTO3_OPTIONAL",
} as const;

export const name2num = {
  FEATURE_NONE: 0,
  FEATURE_PROTO3_OPTIONAL: 1,
} as const;
