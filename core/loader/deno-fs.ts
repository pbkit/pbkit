import { exists } from "https://deno.land/std@0.93.0/fs/exists.ts";
import { resolve } from "https://deno.land/std@0.93.0/path/mod.ts";
import { Loader } from "./index.ts";

export interface CreateLoaderConfig {
  roots: string[];
}
export async function createLoader(
  config: CreateLoaderConfig,
): Promise<Loader> {
  return {
    async load(path) {
      for (const root of config.roots) {
        const absolutePath = resolve(root, path);
        if (!await exists(absolutePath)) continue;
        return {
          absolutePath,
          data: await Deno.readTextFile(absolutePath),
        };
      }
      return null;
    },
  };
}
