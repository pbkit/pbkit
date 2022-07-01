import {
  fromFileUrl as _fromFileUrl,
  isAbsolute,
  resolve as _resolve,
} from "https://deno.land/std@0.122.0/path/posix.ts";
import { Loader } from "./index.ts";

export interface CreateLoaderConfig {
  roots: string[];
}
export function createLoader(
  config: CreateLoaderConfig,
): Loader {
  return {
    async load(path) {
      try {
        if (isFileUrl(path) || isAbsolute(path)) {
          const filePath = fromFileUrl(path);
          const absolutePath = resolve(filePath);
          return { absolutePath, data: await Deno.readTextFile(filePath) };
        }
      } catch {
        return null;
      }
      for (const root of config.roots) {
        const absolutePath = resolve(root, path);
        const filePath = fromFileUrl(absolutePath);
        try {
          await Deno.lstat(filePath);
        } catch {
          continue;
        }
        return { absolutePath, data: await Deno.readTextFile(filePath) };
      }
      return null;
    },
  };
}

function isFileUrl(path: string): boolean {
  return path.startsWith("file://");
}

export function resolve(absolutePath: string, subPath: string = ""): string {
  return "file://" + _resolve(fromFileUrl(absolutePath), subPath);
}

export function fromFileUrl(path: string): string {
  if (!isFileUrl(path)) return path;
  return _fromFileUrl(path);
}
