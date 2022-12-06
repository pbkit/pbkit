import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import resolveRev from "../resolveRev.ts";
import download from "../download.ts";
import isDownloaded from "../isDownloaded.ts";
import unuseCurrentVersion from "../unuseCurrentVersion.ts";
import {
  getToplevelCommands,
  getToplevelCommandsDir,
} from "../toplevel-commands.ts";
import { setCurrentVersion } from "../current-version.ts";

export default new Command()
  .arguments("[version:string]")
  .description(
    "Install pbkit <version> (default: latest, download if necessary).",
  )
  .action(async (_: void, version = "latest") => {
    const rev = await resolveRev(version);
    if (!isDownloaded(rev)) await download(rev);
    await unuseCurrentVersion();
    setCurrentVersion(rev);
    console.log(`Installing ${rev}...`);
    for (const command of getToplevelCommands(rev)) {
      await Deno.run({
        cmd: [
          "deno",
          "install",
          "-f",
          "-A",
          "--unstable",
          "--no-check",
          "-n",
          command,
          path.resolve(getToplevelCommandsDir(rev), command, "entrypoint.ts"),
        ],
      }).status();
    }
  });
