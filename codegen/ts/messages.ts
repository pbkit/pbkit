import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { snakeToCamel } from "../../misc/case.ts";
import { Enum, Message, Schema } from "../../core/schema/model.ts";
import {
  createTypePathTree,
  iterTypePathTree,
} from "../../core/schema/type-path-tree.ts";
import { ScalarValueType } from "../../core/schema/scalar.ts";
import { CodeEntry } from "../index.ts";
import { GenConfig } from "./index.ts";
import { AddInternalImport, createImportBuffer } from "./import-buffer.ts";

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
  for (const [typePath, subTree] of iterTypePathTree(typePathTree)) {
    const subTypePaths = Object.keys(subTree);
    if (!subTypePaths.length) continue;
    const modulePaths = subTypePaths.filter((typePath) =>
      Object.keys(subTree[typePath]).length > 0
    );
    const typePaths = subTypePaths.filter((typePath) =>
      Object.keys(subTree[typePath]).length < 1
    );
    yield [
      getIndexFilePath(typePath),
      new StringReader(
        [
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
        ].join(""),
      ),
    ];
  }
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
  const typeBodyCode = Object.values(type.fields).map((field) => {
    if (field.kind === "map") {
      // TODO
      return `  ${snakeToCamel(field.name)}?: unknown;\n`;
    } else if (field.kind === "oneof") {
      // TODO
      return `  // TODO: ${field.oneof}.${field.name}`;
    } else {
      const { kind } = field;
      const typeName = (
        field.typePath
          ? pbTypeToTsType(
            field.typePath,
            filePath,
            importBuffer.addInternalImport,
          )
          : "unknown"
      );
      const opt = (kind === "normal" || kind === "optional") ? "?" : "";
      const arr = (kind === "repeated") ? "[]" : "";
      return `  ${snakeToCamel(field.name)}${opt}: ${typeName}${arr};\n`;
    }
  }).join("");
  yield [
    filePath,
    new StringReader([
      importBuffer.getCode(),
      "\n",
      `export interface Type {\n${typeBodyCode}}\n`,
    ].join("")),
  ];
}

function pbTypeToTsType(
  typePath: string,
  here: string,
  addInternalImport: AddInternalImport,
): string {
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
