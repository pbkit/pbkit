import { ensureDirSync } from "https://deno.land/std@0.167.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { getPbkitHomeDir } from "./config.ts";

export function getCurrentVersion(): string | undefined {
  try {
    const currentVersion = Deno.readTextFileSync(getFilePath()).trim();
    if (currentVersion) return currentVersion;
  } catch {}
}

export function setCurrentVersion(rev: string = "") {
  ensureDirSync(getPbkitHomeDir());
  Deno.writeTextFileSync(getFilePath(), rev + "\n");
}

function getFilePath() {
  return path.resolve(getPbkitHomeDir(), "current-version");
}
