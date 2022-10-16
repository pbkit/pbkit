import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import resolveRev from "../resolveRev.ts";
import download from "../download.ts";
import isDownloaded from "../isDownloaded.ts";
import unuseCurrentVersion from "../unuseCurrentVersion.ts";
import {
  getToplevelCommands,
  getToplevelCommandsDir,
} from "../toplevel-commands.ts";
import { setCurrentVersion } from "../current-version.ts";

interface Options {}

export default new Command()
  .arguments("[version:string]")
  .description(
    "Install pbkit <version> (default: latest, download if necessary).",
  )
  .action(async (_options: Options, version: string = "latest") => {
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
