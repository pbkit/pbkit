import { walk } from "https://deno.land/std@0.175.0/fs/walk.ts";
import {
  fromFileUrl,
  isAbsolute,
  relative,
} from "https://deno.land/std@0.175.0/path/mod.ts";
import type { EntryModule } from "./entry-module.ts";

export async function expandEntryModules(
  entryModules: EntryModule[],
): Promise<string[]> {
  const result: string[] = [];
  for (const entryModule of entryModules) {
    try {
      const entryPath = resolveFileUrl(entryModule.path);
      const entries = walk(entryPath, { includeDirs: false, exts: [".proto"] });
      const evaluator = createEntryModuleEvaluator(entryModule);
      for await (const { path } of entries) {
        if (!evaluator.has(path)) continue;
        result.push(relative(entryPath, path));
      }
    } catch {}
  }
  return result;
}

export interface EntryModuleEvaluator {
  has(path: string): boolean;
}
export function createEntryModuleEvaluator(
  entryModule: EntryModule,
): EntryModuleEvaluator {
  const entryPath = resolveFileUrl(entryModule.path);
  const includes = entryModule.includes?.map(resolveFileUrl);
  const excludes = entryModule.excludes?.map(resolveFileUrl);
  return {
    has(path) {
      if (includes && !includes.some((rule) => has(rule, path))) return false;
      if (excludes && excludes.some((rule) => has(rule, path))) return false;
      return has(entryPath, path);
    },
  };
}

function resolveFileUrl(path: string): string {
  return path.startsWith("file://") ? fromFileUrl(path) : path;
}

function has(parent: string, item: string): boolean {
  const r = relative(parent, item);
  return Boolean(r) && !r.startsWith("..") && !isAbsolute(r);
}
