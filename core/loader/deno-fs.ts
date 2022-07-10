import {
  fromFileUrl as _fromFileUrl,
  isAbsolute,
  resolve as _resolve,
  toFileUrl,
} from "https://deno.land/std@0.147.0/path/mod.ts";
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
  return toFileUrl(_resolve(fromFileUrl(absolutePath), subPath)).href;
}

export function fromFileUrl(path: string): string {
  if (!isFileUrl(path)) return path;
  return _fromFileUrl(path);
}
