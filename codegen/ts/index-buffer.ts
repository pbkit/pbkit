import * as directory from "../../misc/directory.ts";

export interface Index {
  filePath: string;
  importAllFroms: { as: string; from: string }[];
  exportTypes: string[];
  reExportTypes: { item: string; as: string; from: string }[];
}
export interface IndexBuffer {
  reExport(from: string, item: string, as: string): void;
  [Symbol.iterator](): Generator<Index>;
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
        yield {
          filePath: [...path, `${indexFilename}.ts`].join("/"),
          importAllFroms: folders.map(
            ([name]) => ({ as: name, from: `./${name}/${indexFilename}.ts` }),
          ),
          exportTypes: folders.map(([name]) => name),
          reExportTypes: files.flatMap(
            ([name, { value }]) =>
              Object.entries(value!).map(
                ([item, as]) => ({ item, as, from: `./${name}.ts` }),
              ),
          ),
        };
      }
    },
  };
}
