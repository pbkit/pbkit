import {
  Command,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
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
  .command("download", (await import("./cmds/download.ts")).default)
  .command("list", (await import("./cmds/list.ts")).default)
  .command("remove", (await import("./cmds/remove.ts")).default)
  .command("use", (await import("./cmds/use.ts")).default)
  .parse(Deno.args);
