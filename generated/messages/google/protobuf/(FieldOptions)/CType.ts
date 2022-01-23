export declare namespace $.google.protobuf.FieldOptions {
  export type CType =
    | "STRING"
    | "CORD"
    | "STRING_PIECE";
}
export type Type = $.google.protobuf.FieldOptions.CType;

export const num2name = {
  0: "STRING",
  1: "CORD",
  2: "STRING_PIECE",
} as const;

export const name2num = {
  STRING: 0,
  CORD: 1,
  STRING_PIECE: 2,
} as const;
