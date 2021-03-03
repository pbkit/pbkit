import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.17.2/command/mod.ts";
import { fetchArchive, readGhHosts } from "../misc/github.ts";
import { save, unzip } from "../misc/archive/zip.ts";
import {
  analyzeDeps,
  cacheDeps,
  getPollapoYml,
  getZipPath,
  parseDep,
  PollapoDep,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";
import { compareRev } from "../rev.ts";

export default new Command()
  .description("Install dependencies.")
  .action(async () => {
    try {
      const ghHosts = await readGhHosts();
      const token = ghHosts["github.com"].oauth_token;
      const home = Deno.env.get("HOME") ?? ".";
      const cacheDir = path.resolve(home, ".pollapo/cache");
      const pollapoYml = await getPollapoYml();
      const fetchZip = getFetchZip(token);
      await cacheDeps({ cacheDir, pollapoYml, fetchZip });
      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });
      const deps = Object.entries(analyzeDepsResult).map(([repo, revs]) => {
        const latest = Object.keys(revs).sort(compareRev).pop()!;
        return `${repo}@${latest}`;
      }).map(parseDep);
      await Promise.all(deps.map(async (dep) => {
        const zipPath = getZipPath(cacheDir, dep);
        const zipData = await Deno.readFile(zipPath);
        const files = await unzip(zipData);
        await save(".pollapo", files);
      }));
    } catch (err) {
      if (err instanceof PollapoYmlNotFoundError) {
        console.error(err.message);
        return Deno.exit(1);
      }
      throw err;
    }
  });

function getFetchZip(token: string) {
  return async function fetchZip(dep: PollapoDep): Promise<Uint8Array> {
    const res = await fetchArchive({ type: "zip", token, ...dep });
    return new Uint8Array(await res.arrayBuffer());
  };
}
