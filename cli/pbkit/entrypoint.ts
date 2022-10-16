import {
  Command,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import download from "./cmds/download.ts";
import list from "./cmds/list.ts";
import remove from "./cmds/remove.ts";
import use from "./cmds/use.ts";
import { getCurrentVersion } from "./current-version.ts";

const command = new Command();
command
  .name("pbkit")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .option("-v, --version", "Print version information", {
    standalone: true,
    action: () => {
      const currentVersion = getCurrentVersion() ?? "";
      console.log(currentVersion.trim());
    },
  })
  .command("help", new HelpCommand())
  .command("download", download)
  .command("list", list)
  .command("remove", remove)
  .command("use", use)
  .parse(Deno.args);
