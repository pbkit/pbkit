export type Type =
  | "UNSPECIFIED"
  | "SPEED"
  | "CODE_SIZE"
  | "LITE_RUNTIME";

export const num2name = {
  0: "UNSPECIFIED",
  1: "SPEED",
  2: "CODE_SIZE",
  3: "LITE_RUNTIME",
} as const;

export const name2num = {
  UNSPECIFIED: 0,
  SPEED: 1,
  CODE_SIZE: 2,
  LITE_RUNTIME: 3,
} as const;
