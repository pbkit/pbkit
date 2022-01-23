export declare namespace $.google.protobuf.FieldDescriptorProto {
  export type Label =
    | "UNSPECIFIED"
    | "LABEL_OPTIONAL"
    | "LABEL_REQUIRED"
    | "LABEL_REPEATED";
}
export type Type = $.google.protobuf.FieldDescriptorProto.Label;

export const num2name = {
  0: "UNSPECIFIED",
  1: "LABEL_OPTIONAL",
  2: "LABEL_REQUIRED",
  3: "LABEL_REPEATED",
} as const;

export const name2num = {
  UNSPECIFIED: 0,
  LABEL_OPTIONAL: 1,
  LABEL_REQUIRED: 2,
  LABEL_REPEATED: 3,
} as const;
