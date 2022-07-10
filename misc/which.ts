import { exists } from "https://deno.land/std@0.147.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.147.0/path/mod.ts";

export default async function which(command: string): Promise<string | null> {
  const pathEnv = Deno.env.get("PATH") ?? "";
  const pathExtEnv = Deno.env.get("PATHEXT");
  const paths = pathEnv.split(path.delimiter);
  const pathExts = pathExtEnv
    ? pathExtEnv.split(path.delimiter).concat("")
    : [""];
  for (const dir of paths) {
    for (const ext of pathExts) {
      const absolutePath = path.resolve(dir, command + ext);
      if (await exists(absolutePath)) return absolutePath;
    }
  }
  return null;
}
