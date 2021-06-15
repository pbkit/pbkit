import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { snakeToCamel } from "../../misc/case.ts";
import { Enum, Message, Schema } from "../../core/schema/model.ts";
import {
  createTypePathTree,
  iterTypePathTree,
} from "../../core/schema/type-path-tree.ts";
import { GenConfig } from "./index.ts";
import { CodeEntry } from "../index.ts";

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
            ? `export {\n${
              modulePaths.map(
                (typePath) => `  ${typePath.substr(1)},\n`,
              ).join("")
            }};\n`
            : "",
          typePaths.map((typePath) => {
            const name = typePath.substr(1);
            return `export { Type as ${name} } from "./${name}.ts";\n`;
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

function* genMessage(typePath: string, type: Message): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  yield [
    filePath,
    new StringReader([
      `export interface Type {\n${
        Object.values(type.fields).map((field) => {
          // TODO
          return `  ${snakeToCamel(field.name)}?: unknown;\n`;
        }).join("")
      }}\n`,
    ].join("")),
  ];
}
