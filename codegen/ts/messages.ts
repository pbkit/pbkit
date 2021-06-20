import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { snakeToCamel } from "../../misc/case.ts";
import * as schema from "../../core/schema/model.ts";
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
  schema: schema.Schema,
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

function* genEnum(typePath: string, type: schema.Enum): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const fields = Object.entries<schema.EnumField>({
    "0": { description: "", name: "UNSPECIFIED", options: {} },
    ...type.fields,
  });
  yield [
    filePath,
    new StringReader([
      `export type Type =\n${
        fields.map(([, { name }]) => `  | "${name}"`).join("\n")
      };\n\n`,
      `export const num2name = {\n${
        fields.map(
          ([fieldNumber, { name }]) => `  ${fieldNumber}: "${name}",`,
        ).join("\n")
      }\n};\n\n`,
      `export const name2num = {\n${
        fields.map(
          ([fieldNumber, { name }]) => `  ${name}: ${fieldNumber},`,
        ).join("\n")
      }\n};\n`,
    ].join("")),
  ];
}

interface Message {
  schema: schema.Message;
  collectionFieldNumbers: Set<number>;
  everyFieldNames: Map<number, string>;
  fields: Field[];
  oneofFields: OneofField[];
}
interface Field {
  schema: schema.MessageField;
  fieldNumber: number;
  name: string;
  type: string;
  default: string | undefined;
}
interface OneofField {
  name: string;
  fields: Field[];
}

const reservedNames = ["Type", "Uint8Array"];
function* genMessage(
  schema: schema.Schema,
  typePath: string,
  type: schema.Message,
): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const importBuffer = createImportBuffer(reservedNames);
  type NonOneofMessageField = Exclude<schema.MessageField, schema.OneofField>;
  const schemaFields = Object.entries(type.fields);
  const schemaOneofFields = schemaFields.filter(
    ([, field]) => field.kind === "oneof",
  ) as [string, schema.OneofField][];
  const schemaNonOneofFields = schemaFields.filter(
    ([, field]) => field.kind !== "oneof",
  ) as [string, NonOneofMessageField][];
  const collections = schemaNonOneofFields.filter(
    ([, field]) => field.kind === "map" || field.kind === "repeated",
  );
  const collectionFieldNumbers = new Set(
    collections.map(([fieldNumber]) => +fieldNumber),
  );
  const everyFieldNames = new Map(
    schemaFields.map(
      ([fieldNumber, { name }]) => [+fieldNumber, snakeToCamel(name)],
    ),
  );
  const oneofFieldTable: { [oneof: string]: OneofField } = {};
  for (const schemaOneofField of schemaOneofFields) {
    const [, schemaField] = schemaOneofField;
    if (schemaField.kind !== "oneof") continue;
    const name = snakeToCamel(schemaField.oneof);
    const oneofField = oneofFieldTable[name] ?? { name, fields: [] };
    oneofField.fields.push(toField(schemaOneofField));
    oneofFieldTable[name] = oneofField;
  }
  const message: Message = {
    schema: type,
    collectionFieldNumbers,
    everyFieldNames,
    fields: schemaNonOneofFields.map(toField),
    oneofFields: Object.values(oneofFieldTable),
  };
  const getCodeConfig: GetCodeConfig = { filePath, importBuffer, message };
  const typeDefCode = getMessageTypeDefCode(getCodeConfig);
  const getDefaultValueCode = getGetDefaultValueCode(getCodeConfig);
  const decodeBinaryCode = getDecodeBinaryCode(getCodeConfig);
  const importCode = importBuffer.getCode();
  yield [
    filePath,
    new StringReader([
      importCode ? importCode + "\n" : "",
      typeDefCode,
      "\n" + getDefaultValueCode,
      "\n" + decodeBinaryCode,
    ].join("")),
  ];
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      name: snakeToCamel(field.name),
      type: getFieldTypeCode(field),
      default: getFieldDefaultCode(field),
    };
  }
  function getFieldTypeCode(field: schema.MessageField): string {
    if (field.kind !== "map") return toTsType(field.typePath);
    const keyTypeName = toTsType(field.keyTypePath);
    const valueTypeName = toTsType(field.valueTypePath);
    return `Map<${keyTypeName}, ${valueTypeName}>`;
  }
  function getFieldDefaultCode(field: schema.MessageField): string | undefined {
    if (field.kind === "repeated") return "[]";
    if (field.kind === "map") return "new Map()";
    if (field.typePath! in scalarTypeDefaultValueCodes) {
      return scalarTypeDefaultValueCodes[field.typePath as ScalarValueTypePath];
    }
    const fieldType = schema.types[field.typePath!];
    if (fieldType?.kind === "enum") {
      return `"${fieldType.fields[0]?.name ?? "UNSPECIFIED"}"`;
    }
  }
  function toTsType(typePath?: string) {
    return pbTypeToTsType(importBuffer.addInternalImport, filePath, typePath);
  }
}

interface GetCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  message: Message;
}
type GetCodeFn = (config: GetCodeConfig) => string;

const getMessageTypeDefCode: GetCodeFn = ({ message }) => {
  const typeBodyCodes: string[] = [];
  if (message.fields.length) typeBodyCodes.push(getFieldsCode());
  if (message.oneofFields.length) typeBodyCodes.push(getOneofsCode());
  if (!typeBodyCodes.length) return `export interface Type {}\n`;
  return `export interface Type {\n${typeBodyCodes.join("")}}\n`;
  function getFieldsCode() {
    return message.fields.map((field) => {
      const nullable = (
        (field.default == null) ||
        (field.schema.kind === "optional")
      );
      const opt = nullable ? "?" : "";
      const arr = (field.schema.kind === "repeated") ? "[]" : "";
      return `  ${field.name}${opt}: ${field.type}${arr};\n`;
    }).join("");
  }
  function getOneofsCode() {
    return message.oneofFields.map((oneofField) => {
      return `  ${oneofField.name}?: (\n${
        oneofField.fields.map(
          (field) => `    | { field: "${field.name}", value: ${field.type} }\n`,
        ).join("")
      }  );\n`;
    }).join("");
  }
};

const getGetDefaultValueCode: GetCodeFn = ({ message }) => {
  return [
    "export function getDefaultValue(): Type {\n",
    "  return {\n",
    message.fields.map((field) => {
      if (!field.default) return `    ${field.name}: undefined,\n`;
      return `    ${field.name}: ${field.default},\n`;
    }).join(""),
    message.oneofFields.map(
      (field) => `    ${field.name}: undefined,\n`,
    ).join(""),
    "  };\n",
    "}\n",
  ].join("");
};

const getDecodeBinaryCode: GetCodeFn = (
  { filePath, importBuffer, message },
) => {
  const deserialize = importBuffer.addInternalImport(
    filePath,
    "runtime/wire/deserialize",
    "default",
    "deserialize",
  );
  return [
    message.oneofFields.length
      ? [
        "const fieldNames: Map<number, string> = new Map([\n",
        [...message.everyFieldNames].map(
          ([fieldNumber, name]) => `  [${fieldNumber}, "${name}"],\n`,
        ).join(""),
        "]);\n",
      ].join("")
      : "",
    message.oneofFields.length
      ? [
        "const oneofFieldNumbersMap: { [oneof: string]: Set<number> } = {\n",
        message.oneofFields.map(({ name, fields }) => {
          return [
            `  ${name}: new Set([`,
            fields.map(({ fieldNumber }) => fieldNumber).join(", "),
            "]),\n",
          ].join("");
        }).join(""),
        "};\n",
      ].join("")
      : "",
    "export function decodeBinary(binary: Uint8Array): Type {\n",
    "  const result = getDefaultValue();\n",
    `  const wireMessage = ${deserialize}(binary);\n`,
    "  const wireFields = new Map(wireMessage);\n",
    message.oneofFields.length
      ? "  const wireFieldNumbers = Array.from(wireFields.keys()).reverse();\n"
      : "",
    message.fields.map(({ fieldNumber, name }) => {
      const isCollection = message.collectionFieldNumbers.has(fieldNumber);
      if (isCollection) {
        return [
          "  collection: {\n",
          `    const wireValue = wireMessage.filter(([fieldNumber]) => fieldNumber === ${fieldNumber});\n`,
          "    const value = todo(wireValue);\n",
          "    if (value === undefined) break collection;\n",
          `    result.${name} = value;\n`,
          "  }\n",
        ].join("");
      } else {
        return [
          "  field: {\n",
          `    const wireValue = wireFields.get(${fieldNumber});\n`,
          "    const value = todo(wireValue);\n",
          "    if (value === undefined) break field;\n",
          `    result.${name} = value;\n`,
          "  }\n",
        ].join("");
      }
    }).join(""),
    message.oneofFields.map(({ name }) => {
      return [
        "  oneof: {\n",
        `    const oneofFieldNumbers = oneofFieldNumbersMap.${name};\n`,
        "    const fieldNumber = wireFieldNumbers.find(v => oneofFieldNumbers.has(v));\n",
        "    if (fieldNumber == null) break oneof;\n",
        "    const wireValue = wireFields.get(fieldNumber);\n",
        "    const value = todo(wireValue);\n",
        "    if (value === undefined) break oneof;\n",
        `    result.${name} = { field: fieldNames[fieldNumber], value };\n`,
        "  }\n",
      ].join("");
    }).join(""),
    "  return result;\n",
    "}\n",
  ].join("");
};

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
type ScalarValueTypePath = `.${ScalarValueType}`;
type ScalarToCodeTable = { [typePath in ScalarValueTypePath]: string };
const scalarTypeMapping: ScalarToCodeTable = {
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
const scalarTypeDefaultValueCodes: ScalarToCodeTable = {
  ".double": "0",
  ".float": "0",
  ".int32": "0",
  ".int64": '"0"',
  ".uint32": "0",
  ".uint64": '"0"',
  ".sint32": "0",
  ".sint64": '"0"',
  ".fixed32": "0",
  ".fixed64": '"0"',
  ".sfixed32": "0",
  ".sfixed64": '"0"',
  ".bool": "false",
  ".string": '""',
  ".bytes": "new Uint8Array()",
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
