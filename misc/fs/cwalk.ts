import { join } from "https://deno.land/std@0.147.0/path/mod.ts";
import { walk, WalkEntry } from "https://deno.land/std@0.147.0/fs/walk.ts";
import { createWalkEntry } from "https://deno.land/std@0.147.0/fs/_util.ts";
import { createEventBuffer } from "../../core/runtime/async/event-buffer.ts";

const concurrentWalk: typeof walk = function (root, {
  maxDepth = Infinity,
  includeFiles = true,
  includeDirs = true,
  followSymlinks = false,
  exts = undefined,
  match = undefined,
  skip = undefined,
} = {}): AsyncIterableIterator<WalkEntry> {
  const eventBuffer = createEventBuffer<WalkEntry>();
  const _walk = async function (root: string, maxDepth: number) {
    const promises: Promise<any>[] = [];
    try {
      if (maxDepth < 0) return;
      if (includeDirs && include(root, exts, match, skip)) {
        promises.push(createWalkEntry(root).then(eventBuffer.push));
      }
      if (maxDepth < 1 || !include(root, undefined, undefined, skip)) return;
      for await (const entry of Deno.readDir(root)) {
        let path = join(root, entry.name);
        let { isSymlink, isDirectory } = entry;
        if (isSymlink) {
          if (!followSymlinks) continue;
          path = await Deno.realPath(path);
          ({ isSymlink, isDirectory } = await Deno.lstat(path));
        }
        if (isSymlink || isDirectory) {
          promises.push(_walk(path, maxDepth - 1));
        } else if (includeFiles && include(path, exts, match, skip)) {
          eventBuffer.push({ path, ...entry });
        }
      }
    } finally {
      await Promise.allSettled(promises);
    }
  };
  _walk(root, maxDepth).then(eventBuffer.finish);
  return eventBuffer.drain();
};

export default concurrentWalk;

function include(
  path: string,
  exts?: string[],
  match?: RegExp[],
  skip?: RegExp[],
): boolean {
  if (exts && !exts.some((ext): boolean => path.endsWith(ext))) {
    return false;
  }
  if (match && !match.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  if (skip && skip.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  return true;
}
