import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import * as path from "https://deno.land/std@0.175.0/path/mod.ts";
import { getVersionsDir } from "../config.ts";
import getLocalVersions from "../getLocalVersions.ts";
import { getCurrentVersion } from "../current-version.ts";
import unuseCurrentVersion from "../unuseCurrentVersion.ts";

export default new Command()
  .arguments("<versions...:string>")
  .description("Remove given pbkit versions.")
  .action(async (_: void, ...versions: string[]) => {
    const versionsDir = getVersionsDir();
    const localVersions = getLocalVersions();
    const currentVersion = getCurrentVersion();
    for (const version of versions) {
      if (version === currentVersion) await unuseCurrentVersion();
      if (!localVersions.includes(version)) {
        console.error(`${version} is not downloaded.`);
        continue;
      }
      await Deno.remove(
        path.resolve(versionsDir, version),
        { recursive: true },
      );
    }
  });
