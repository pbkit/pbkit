import { existsSync } from "node:fs";
import * as path from "node:path";

export default function which(command: string): string | null {
  const pathEnv = Deno.env.get("PATH") ?? "";
  const pathExtEnv = Deno.env.get("PATHEXT");
  const paths = pathEnv.split(path.delimiter);
  const pathExts = pathExtEnv
    ? pathExtEnv.split(path.delimiter).concat("")
    : [""];
  for (const dir of paths) {
    for (const ext of pathExts) {
      const absolutePath = path.resolve(dir, command + ext);
      if (existsSync(absolutePath)) return absolutePath;
    }
  }
  return null;
}
