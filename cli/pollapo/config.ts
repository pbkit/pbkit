import * as path from "https://deno.land/std@0.84.0/path/mod.ts";

export function getConfigDir() {
  const home = Deno.env.get("HOME") ?? ".";
  return path.resolve(home, ".config/pollapo");
}

export function getCacheDir() {
  return path.resolve(getConfigDir(), "cache");
}
