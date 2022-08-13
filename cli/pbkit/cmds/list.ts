import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { isSemver } from "../../pollapo/rev.ts";
import { fetchTags } from "../../../misc/github/index.ts";
import getLocalVersions from "../getLocalVersions.ts";

interface Options {
  remote?: boolean;
}

export default new Command()
  .description("List downloaded pbkit versions.")
  .option("-r, --remote", "List versions available for download.")
  .action(async (options: Options) => {
    const versions = await (async () => {
      if (options.remote) {
        const tags = await fetchTags({ user: "pbkit", repo: "pbkit" });
        return tags.map((tag) => tag.name.trim()).filter(isSemver);
      } else {
        return getLocalVersions();
      }
    })();
    if (versions.length < 1 && !options.remote) {
      console.error("No downloaded pbkit versions found.");
      Deno.exit(1);
    }
    console.log(versions.join("\n"));
  });
