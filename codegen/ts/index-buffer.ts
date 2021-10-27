import { StringReader } from "https://deno.land/std@0.107.0/io/mod.ts";
import { CodeEntry } from "../index.ts";
import * as directory from "../../misc/directory.ts";

export interface IndexBuffer {
  reExport(from: string, item: string, as: string): void;
  [Symbol.iterator](): Generator<CodeEntry>;
}
export function createIndexBuffer(): IndexBuffer {
  interface Items {
    [as: string]: string;
  }
  let root: directory.Folder<Items> = directory.empty;
  return {
    reExport(from, item, as) {
      const path = directory.textToPath(from);
      const items = directory.get(root, path)?.value;
      root = directory.set(root, path, { ...items, [item]: as });
    },
    *[Symbol.iterator]() {
      for (const [path, folder] of directory.walkFolders(root)) {
        const entries = Object.entries(folder.children);
        const folders = entries.filter(([, node]) => !node.value);
        const files = entries.filter(([, node]) => node.value);
        const codes = [
          ...folders.map(
            ([name]) => `import * as ${name} from "./${name}/index.ts";\n`,
          ),
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
        if (folder.value) {
          const [[item, as]] = Object.entries(folder.value);
          codes.push("\n");
          codes.push(`import { ${item} as _ } from "../${as}";\n`);
          codes.push("export default _;\n");
        }
        yield [
          [...path, "index.ts"].join("/"),
          new StringReader(codes.join("")),
        ];
      }
    },
  };
}
