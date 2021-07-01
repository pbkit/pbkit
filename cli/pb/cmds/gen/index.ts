import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import json from "./cmds/json.ts";
import kotlin from "./cmds/kotlin.ts";
import ts from "./cmds/ts.ts";

export default new Command()
  .arguments("<command> [options]")
  .description("Generate code.")
  .command("json", json)
  .command("kotlin", kotlin)
  .command("ts", ts);
