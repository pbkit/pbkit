export type Type =
  | "UNSPECIFIED"
  | "LABEL_OPTIONAL"
  | "LABEL_REQUIRED"
  | "LABEL_REPEATED";

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
