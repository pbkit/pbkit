import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";

import Add from "./cmds/add.ts";
import Install from "./cmds/install.ts";
import Login from "./cmds/login.ts";
import Remove from "./cmds/remove.ts";
import Why from "./cmds/why.ts";

const command = new Command();
command
  .name("pollapo")
  .arguments("<command> [options]")
  .command("add", Add)
  .command("install", Install)
  .command("login", Login)
  .command("remove", Remove)
  .command("why", Why)
  .parse(Deno.args);
