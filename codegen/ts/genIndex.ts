import { StringReader } from "https://deno.land/std@0.101.0/io/mod.ts";
import * as path from "https://deno.land/std@0.101.0/path/mod.ts";
import {
  iterTypePathTree,
  TypePathTree,
} from "../../core/schema/type-path-tree.ts";
import { CodeEntry } from "../index.ts";

export interface GenIndexConfig {
  typePathTree: TypePathTree;
  exists(typePath: string): boolean;
  getIndexFilePath(typePath: string): string;
  getFilePath(typePath: string): string;
  itemIsExportedAs: string;
}
export default function* genIndex(
  config: GenIndexConfig,
): Generator<CodeEntry> {
  const codeEntry = getIndexCodeEntry(config, "", config.typePathTree);
  if (codeEntry) yield codeEntry;
  for (const [typePath, subTree] of iterTypePathTree(config.typePathTree)) {
    const codeEntry = getIndexCodeEntry(config, typePath, subTree);
    if (codeEntry) yield codeEntry;
  }
}

function getIndexCodeEntry(
  config: GenIndexConfig,
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
      return `export type { ${config.itemIsExportedAs} as ${name} } from "./${name}.ts";\n`;
    }).join(""),
  ];
  const indexFilePath = config.getIndexFilePath(typePath);
  if (config.exists(typePath)) {
    const filePath = config.getFilePath(typePath);
    const from = path.relative(path.dirname(indexFilePath), filePath);
    codes.push([
      "\n",
      `import { ${config.itemIsExportedAs} as _ } from "${from}";\n`,
      "export default _;\n",
    ].join(""));
  }
  return [indexFilePath, new StringReader(codes.join(""))];
}
