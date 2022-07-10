import { StringReader } from "https://deno.land/std@0.147.0/io/mod.ts";
import { CodeEntry } from "../index.ts";
import * as directory from "../../misc/directory.ts";

export interface IndexBuffer {
  reExport(from: string, item: string, as: string): void;
  [Symbol.iterator](): Generator<CodeEntry>;
}
export interface CreateIndexBufferConfig {
  indexFilename?: string;
}
export function createIndexBuffer(
  config?: CreateIndexBufferConfig,
): IndexBuffer {
  interface Items {
    [as: string]: string;
  }
  let root: directory.Folder<Items> = directory.empty;
  const indexFilename = config?.indexFilename || "index";
  const folderEntryToImportStmt = ([name]: [string, unknown]) => {
    return `import * as ${name} from "./${name}/${indexFilename}.ts";\n`;
  };
  return {
    reExport(from, item, as) {
      const path = directory.textToPath(from);
      const items = directory.get(root, path)?.value;
      root = directory.set(root, path, { ...items, [item]: as });
    },
    *[Symbol.iterator]() {
      for (const [path, folder] of directory.walkFolders(root)) {
        const entries = Object.entries(folder.children);
        const folders = entries.filter(
          ([name, node]) => !name.startsWith("(") && !node.value,
        );
        const files = entries.filter(([, node]) => node.value);
        const codes = [
          ...folders.map(folderEntryToImportStmt),
          folders.length
            ? `export type {\n${
              folders.map(([name]) => `  ${name},\n`).join("")
            }};\n`
            : "",
          ...files.flatMap(
            ([name, { value }]) =>
              Object.entries(value!).map(
                ([item, as]) => (
                  `export type { ${item} as ${as} } from "./${name}.ts";\n`
                ),
              ),
          ),
        ];
        yield [
          [...path, `${indexFilename}.ts`].join("/"),
          new StringReader(codes.join("")),
        ];
      }
    },
  };
}
