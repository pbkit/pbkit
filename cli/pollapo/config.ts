import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { getHomeDir } from "../../misc/env.ts";

export function getConfigDir() {
  return path.resolve(getHomeDir(), ".config/pollapo");
}

export function getCacheDir() {
  return Deno.env.get("POLLAPO_CACHE_DIR") ||
    path.resolve(getConfigDir(), "cache");
}
