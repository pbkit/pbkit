import { walk } from "https://deno.land/std@0.107.0/fs/walk.ts";
import { relative } from "https://deno.land/std@0.107.0/path/mod.ts";

export default async function expandEntryPaths(
  entryPaths: string[],
): Promise<string[]> {
  const result: string[] = [];
  for (const entryPath of entryPaths) {
    const entries = walk(entryPath, { includeDirs: false, exts: [".proto"] });
    for await (const { path } of entries) {
      result.push(relative(entryPath, path));
    }
  }
  return result;
}
