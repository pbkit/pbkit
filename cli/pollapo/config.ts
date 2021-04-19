import * as path from "https://deno.land/std@0.93.0/path/mod.ts";

export function getHomeDir() {
  return Deno.env.get(
    Deno.build.os === "windows" ? "USERPROFILE" : "HOME",
  ) || ".";
}

export function getConfigDir() {
  return path.resolve(getHomeDir(), ".config/pollapo");
}

export function getCacheDir() {
  return path.resolve(getConfigDir(), "cache");
}
