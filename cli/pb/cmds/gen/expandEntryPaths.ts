import { walk } from "https://deno.land/std@0.122.0/fs/walk.ts";
import {
  fromFileUrl,
  relative,
} from "https://deno.land/std@0.122.0/path/mod.ts";

export default async function expandEntryPaths(
  entryPaths: string[],
): Promise<string[]> {
  const result: string[] = [];
  for (const _entryPath of entryPaths) {
    const entryPath = _entryPath.startsWith("file://")
      ? fromFileUrl(_entryPath)
      : _entryPath;
    try {
      const entries = walk(entryPath, { includeDirs: false, exts: [".proto"] });
      for await (const { path } of entries) {
        result.push(relative(entryPath, path));
      }
    } catch {}
  }
  return result;
}
