import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { groupBy } from "../../misc/array.ts";
import { snakeToCamel } from "../../misc/case.ts";
import { Enum, Message, OneofField, Schema } from "../../core/schema/model.ts";
import {
  createTypePathTree,
  iterTypePathTree,
  TypePathTree,
} from "../../core/schema/type-path-tree.ts";
import { ScalarValueType } from "../../core/schema/scalar.ts";
import { CodeEntry } from "../index.ts";
import { GenConfig } from "./index.ts";
import {
  AddInternalImport,
  createImportBuffer,
  ImportBuffer,
} from "./import-buffer.ts";

export default function* gen(
  schema: Schema,
  _config: GenConfig,
): Generator<CodeEntry> {
  yield* genIndex(schema);
  for (const [typePath, type] of Object.entries(schema.types)) {
    switch (type.kind) {
      case "enum":
        yield* genEnum(typePath, type);
        continue;
      case "message":
        yield* genMessage(typePath, type);
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

function* genIndex(schema: Schema): Generator<CodeEntry> {
  const typePathTree = createTypePathTree(Object.keys(schema.types));
  const codeEntry = getIndexCodeEntry(schema, "", typePathTree);
  if (codeEntry) yield codeEntry;
  for (const [typePath, subTree] of iterTypePathTree(typePathTree)) {
    const codeEntry = getIndexCodeEntry(schema, typePath, subTree);
    if (codeEntry) yield codeEntry;
  }
}

function getIndexCodeEntry(
  schema: Schema,
  typePath: string,
  subTree: TypePathTree,
): CodeEntry | undefined {
  const subTypePaths = Object.keys(subTree);
  if (!subTypePaths.length) return;
  const modulePaths = subTypePaths.filter((typePath) =>
    Object.keys(subTree[typePath]).length > 0
  );
  const typePaths = subTypePaths.filter((typePath) =>
    Object.keys(subTree[typePath]).length < 1
  );
  const codes: string[] = [
    modulePaths.map((typePath) => {
      const name = typePath.substr(1);
      return `import * as ${name} from "./${name}/index.ts";\n`;
    }).join(""),
    modulePaths.length
      ? `export type {\n${
        modulePaths.map(
          (typePath) => `  ${typePath.substr(1)},\n`,
        ).join("")
      }};\n`
      : "",
    typePaths.map((typePath) => {
      const name = typePath.substr(1);
      return `export type { Type as ${name} } from "./${name}.ts";\n`;
    }).join(""),
  ];
  const indexFilePath = getIndexFilePath(typePath);
  if (typePath in schema.types) {
    const filePath = getFilePath(typePath);
    const from = path.relative(path.dirname(indexFilePath), filePath);
    codes.push([
      "\n",
      `import { Type as _ } from "${from}";\n`,
      "export default _;\n",
    ].join(""));
  }
  return [indexFilePath, new StringReader(codes.join(""))];
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
function* genMessage(typePath: string, type: Message): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const importBuffer = createImportBuffer(reservedNames);
  const typeDefCode = getMessageTypeDefCode(
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
        const opt = (kind === "normal" || kind === "optional") ? "?" : "";
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

function pbTypeToTsType(
  addInternalImport: AddInternalImport,
  here: string,
  typePath?: string,
): string {
  if (!typePath) return "unknown";
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
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
