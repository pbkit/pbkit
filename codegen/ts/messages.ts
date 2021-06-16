import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { groupBy } from "../../misc/array.ts";
import { snakeToCamel } from "../../misc/case.ts";
import { Enum, Message, OneofField, Schema } from "../../core/schema/model.ts";
import { createTypePathTree } from "../../core/schema/type-path-tree.ts";
import { ScalarValueType } from "../../core/schema/scalar.ts";
import { CodeEntry } from "../index.ts";
import { GenConfig } from "./index.ts";
import {
  AddInternalImport,
  createImportBuffer,
  ImportBuffer,
} from "./import-buffer.ts";
import genIndex from "./genIndex.ts";

export default function* gen(
  schema: Schema,
  _config: GenConfig,
): Generator<CodeEntry> {
  yield* genIndex({
    typePathTree: createTypePathTree(Object.keys(schema.types)),
    exists: (typePath) => typePath in schema.types,
    getIndexFilePath,
    getFilePath,
    itemIsExportedAs: "Type",
  });
  for (const [typePath, type] of Object.entries(schema.types)) {
    switch (type.kind) {
      case "enum":
        yield* genEnum(typePath, type);
        continue;
      case "message":
        yield* genMessage(schema, typePath, type);
        continue;
    }
  }
}

export function getIndexFilePath(typePath: string): string {
  return path.join("messages", typePath.replaceAll(".", "/"), "index.ts");
}

export function getFilePath(typePath: string): string {
  return path.join("messages", typePath.replaceAll(".", "/") + ".ts");
}

function* genEnum(typePath: string, type: Enum): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  yield [
    filePath,
    new StringReader([
      `export type Type =\n${
        Object.values(type.fields).map(
          (field) => `  | "${field.name}"`,
        ).join("\n")
      };\n\n`,
      `export const num2name = {\n${
        Object.entries(type.fields).map(
          ([fieldNumber, { name }]) => `  ${fieldNumber}: "${name}",`,
        ).join("\n")
      }\n};\n\n`,
      `export const name2num = {\n${
        Object.entries(type.fields).map(
          ([fieldNumber, { name }]) => `  ${name}: ${fieldNumber},`,
        ).join("\n")
      }\n};\n`,
    ].join("")),
  ];
}

const reservedNames = ["Type", "Uint8Array"];
function* genMessage(
  schema: Schema,
  typePath: string,
  type: Message,
): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const importBuffer = createImportBuffer(reservedNames);
  const typeDefCode = getMessageTypeDefCode(
    schema,
    filePath,
    importBuffer,
    type,
  );
  const importCode = importBuffer.getCode();
  yield [
    filePath,
    new StringReader([
      importCode ? importCode + "\n" : "",
      typeDefCode,
    ].join("")),
  ];
}

function getMessageTypeDefCode(
  schema: Schema,
  filePath: string,
  importBuffer: ImportBuffer,
  type: Message,
) {
  function getTsType(typePath?: string) {
    return pbTypeToTsType(importBuffer.addInternalImport, filePath, typePath);
  }
  const oneofFields: OneofField[] = [];
  const typeBodyCodes: string[] = [];
  const fields = Object.values(type.fields);
  if (fields.length) typeBodyCodes.push(getFieldsCode());
  const oneofs = [...groupBy(oneofFields, "oneof")];
  if (oneofFields.length) typeBodyCodes.push(getOneofsCode());
  if (!typeBodyCodes.length) return `export interface Type {}\n`;
  return `export interface Type {\n${typeBodyCodes.join("")}}\n`;
  function getFieldsCode() {
    return fields.map((field) => {
      if (field.kind === "map") {
        const fieldName = snakeToCamel(field.name);
        const keyTypeName = getTsType(field.keyTypePath);
        const valueTypeName = getTsType(field.valueTypePath);
        return `  ${fieldName}?: Map<${keyTypeName}, ${valueTypeName}>;\n`;
      } else if (field.kind === "oneof") {
        oneofFields.push(field);
        return "";
      } else {
        const fieldName = snakeToCamel(field.name);
        const typeName = getTsType(field.typePath);
        const { kind } = field;
        const isScalar = field.typePath! in scalarTypeMapping;
        const isEnum = schema.types[field.typePath!]?.kind === "enum";
        const hasDefaultValue = isScalar || isEnum;
        const nullable = (
          (!hasDefaultValue && kind === "normal") ||
          (kind === "optional")
        );
        const opt = nullable ? "?" : "";
        const arr = (kind === "repeated") ? "[]" : "";
        return `  ${fieldName}${opt}: ${typeName}${arr};\n`;
      }
    }).join("");
  }
  function getOneofsCode() {
    return oneofs.map(
      ([oneof, fields]) => {
        const fieldName = snakeToCamel(oneof);
        const fieldsCode = fields.map((field) => {
          const fieldName = snakeToCamel(field.name);
          const typeName = getTsType(field.typePath);
          return `    | { field: "${fieldName}", value: ${typeName} }\n`;
        }).join("");
        return `  ${fieldName}?: (\n${fieldsCode}  );\n`;
      },
    ).join("");
  }
}

export function pbTypeToTsType(
  addInternalImport: AddInternalImport,
  here: string,
  typePath?: string,
): string {
  if (!typePath) return "unknown";
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
  if (typePath in wellKnownTypeMapping) return wellKnownTypeMapping[typePath];
  const from = getFilePath(typePath);
  const as = typePath.match(/[^.]+$/)?.[0]!;
  return addInternalImport(here, from, "Type", as);
}
const scalarTypeMapping: { [typePath in `.${ScalarValueType}`]: string } = {
  ".double": "number",
  ".float": "number",
  ".int32": "number",
  ".int64": "string",
  ".uint32": "number",
  ".uint64": "string",
  ".sint32": "number",
  ".sint64": "string",
  ".fixed32": "number",
  ".fixed64": "string",
  ".sfixed32": "number",
  ".sfixed64": "string",
  ".bool": "boolean",
  ".string": "string",
  ".bytes": "Uint8Array",
};
const wellKnownTypeMapping: { [typePath: string]: string } = {
  ".google.protobuf.BoolValue": "boolean",
  ".google.protobuf.BytesValue": "Uint8Array",
  ".google.protobuf.DoubleValue": "number",
  ".google.protobuf.FloatValue": "number",
  ".google.protobuf.Int32Value": "number",
  ".google.protobuf.Int64Value": "string",
  ".google.protobuf.NullValue": "null",
  ".google.protobuf.StringValue": "string",
  ".google.protobuf.UInt32Value": "number",
  ".google.protobuf.UInt64Value": "string",
};
