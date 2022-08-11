import {
  Command,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import download from "./cmds/download.ts";
import list from "./cmds/list.ts";
import remove from "./cmds/remove.ts";
import use from "./cmds/use.ts";

const command = new Command();
command
  .name("pbkit")
  .action(() => {
    command.showHelp();
    Deno.exit(0);
  })
  .command("help", new HelpCommand())
  .command("download", download)
  .command("list", list)
  .command("remove", remove)
  .command("use", use)
  .parse(Deno.args);
