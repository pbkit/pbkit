import * as path from "https://deno.land/std@0.175.0/path/mod.ts";
import { getVersionsDir } from "./config.ts";

export default function isDownloaded(rev: string): boolean {
  try {
    const fileInfo = Deno.lstatSync(path.resolve(getVersionsDir(), rev));
    return fileInfo.isDirectory;
  } catch {
    return false;
  }
}
