import { Handler, Server } from "https://deno.land/std@0.136.0/http/server.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { createLoader } from "../../../../core/loader/deno-fs.ts";
import { build } from "../../../../core/schema/builder.ts";
import { getVendorDir } from "../../config.ts";
import expandEntryPaths from "../gen/expandEntryPaths.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
}

const command = new Command()
  .arguments("[proto-files...:string]")
  .option(
    "--entry-path <dir:string>",
    "Specify the directory containing entry proto files.",
    { collect: true },
  )
  .option(
    "--proto-path <dir:string>",
    "Specify the directory in which to search for imports.",
    { collect: true },
  )
  .action(async (options: Options, protoFiles: string[] = []) => {
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    const listener = Deno.listen({ port: 40000, transport: "tcp" });
    const schema = await build({ loader, files });
    new Server({
      handler: async (req: Request) => {
        const pathname = new URL(req.url).pathname;
        switch (pathname) {
          case "/schema": {
            return new Response(JSON.stringify(schema), {
              headers: { ["Access-Control-Allow-Origin"]: "*" },
            });
          }
          case "/types": {
            return new Response(JSON.stringify(schema.types), {
              headers: { ["Access-Control-Allow-Origin"]: "*" },
            });
          }
        }
        return new Response("OK", { status: 200 });
      },
    }).serve(listener);

    console.error(`Listening on ${(listener.addr as Deno.NetAddr).port}`);
  });

export default command;
