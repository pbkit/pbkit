import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { compareRev, isSemver } from "../../pollapo/rev.ts";
import { fetchTags } from "../../../misc/github/index.ts";
import { getVersionsDir } from "../config.ts";

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
        try {
          const items = Array.from(Deno.readDirSync(getVersionsDir()));
          return items.filter(
            ({ name, isDirectory }) => isDirectory && isSemver(name),
          ).map((item) => item.name).sort(compareRev).reverse();
        } catch {
          return [];
        }
      }
    })();
    if (versions.length < 1 && !options.remote) {
      console.error("No downloaded pbkit versions found.");
      Deno.exit(1);
    }
    console.log(versions.join("\n"));
  });
