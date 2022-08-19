export declare namespace $.google.protobuf.GeneratedCodeInfo.Annotation {
  export type Semantic =
    | "NONE"
    | "SET"
    | "ALIAS";
}
export type Type = $.google.protobuf.GeneratedCodeInfo.Annotation.Semantic;

export const num2name = {
  0: "NONE",
  1: "SET",
  2: "ALIAS",
} as const;

export const name2num = {
  NONE: 0,
  SET: 1,
  ALIAS: 2,
} as const;
