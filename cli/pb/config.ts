import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { getHomeDir } from "../../misc/env.ts";

export function getConfigDir() {
  return path.resolve(getHomeDir(), ".config/pb");
}

export function getVendorDir() {
  return Deno.env.get("PB_VENDOR_DIR") ||
    path.resolve(getConfigDir(), "vendor");
}
