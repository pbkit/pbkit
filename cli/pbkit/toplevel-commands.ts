import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { getVersionsDir } from "./config.ts";

export function getToplevelCommands(rev: string): string[] {
  return Array.from(
    Deno.readDirSync(getToplevelCommandsDir(rev)),
  ).map((item) => item.name).sort();
}

export function getToplevelCommandsDir(rev: string): string {
  return path.resolve(getVersionsDir(), rev, "cli");
}
