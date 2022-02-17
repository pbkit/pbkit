import { exists } from "https://deno.land/std@0.122.0/fs/exists.ts";
import {
  fromFileUrl,
  isAbsolute,
  resolve,
} from "https://deno.land/std@0.122.0/path/mod.ts";
import { Loader } from "./index.ts";

export interface CreateLoaderConfig {
  roots: string[];
}
export function createLoader(
  config: CreateLoaderConfig,
): Loader {
  return {
    async load(path) {
      if (isFileUrl(path) || isAbsolute(path)) {
        const filePath = _fromFileUrl(path);
        const absolutePath = _resolve(filePath);
        if (!await exists(filePath)) return null;
        return { absolutePath, data: await Deno.readTextFile(filePath) };
      }
      for (const root of config.roots) {
        const absolutePath = _resolve(root, path);
        const filePath = _fromFileUrl(absolutePath);
        if (!await exists(filePath)) continue;
        return { absolutePath, data: await Deno.readTextFile(filePath) };
      }
      return null;
    },
  };
}

function isFileUrl(path: string): boolean {
  return path.startsWith("file://");
}

function _resolve(absolutePath: string, subPath: string = ""): string {
  return "file://" + resolve(_fromFileUrl(absolutePath), subPath);
}

function _fromFileUrl(path: string): string {
  if (!isFileUrl(path)) return path;
  return fromFileUrl(path);
}
