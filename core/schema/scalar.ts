export type ScalarValueTypePath = `.${ScalarValueType}`;
export type ScalarValueType = (typeof scalarValueTypes)[number];
export const scalarValueTypes = [
  "double",
  "float",
  "int32",
  "int64",
  "uint32",
  "uint64",
  "sint32",
  "sint64",
  "fixed32",
  "fixed64",
  "sfixed32",
  "sfixed64",
  "bool",
  "string",
  "bytes",
] as const;
