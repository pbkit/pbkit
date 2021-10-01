import { walk } from "https://deno.land/std@0.107.0/fs/walk.ts";

export default async function expandEntryPaths(
  entryPaths: string[],
): Promise<string[]> {
  const result: string[] = [];
  for (const entryPath of entryPaths) {
    const entries = walk(entryPath, { includeDirs: false, exts: [".proto"] });
    for await (const entry of entries) {
      result.push(entry.path.substr(entryPath.length + 1));
    }
  }
  return result;
}
