import * as path from "https://deno.land/std@0.101.0/path/mod.ts";
import { getHomeDir } from "../../misc/env.ts";

export function getConfigDir() {
  return path.resolve(getHomeDir(), ".config/pollapo");
}

export function getCacheDir() {
  return path.resolve(getConfigDir(), "cache");
}
