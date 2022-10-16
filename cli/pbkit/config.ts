import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { getHomeDir } from "../../misc/env.ts";

export function getPbkitHomeDir() {
  return Deno.env.get("PBKIT_HOME") || path.resolve(getHomeDir(), ".pbkit");
}

export function getVersionsDir() {
  return path.resolve(getPbkitHomeDir(), "versions");
}
