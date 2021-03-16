import { emptyDir } from "https://deno.land/std@0.88.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { fetchArchive, readGhHosts } from "../misc/github.ts";
import { save, stripComponents, unzip } from "../misc/archive/zip.ts";
import { print, println } from "../misc/stdio.ts";
import { getCacheDir } from "../config.ts";
import {
  analyzeDeps,
  cacheDeps,
  depToString,
  getPollapoYml,
  getZipPath,
  parseDep,
  PollapoDep,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";
import { compareRev } from "../rev.ts";

interface Options {
  outDir: string;
}

export default new Command()
  .description("Install dependencies.")
  .option("-o, --out-dir <value:string>", "Set out directory", {
    default: ".pollapo",
  })
  .action(async (options: Options) => {
    try {
      const ghHosts = await readGhHosts();
      const token = ghHosts["github.com"].oauth_token;
      const cacheDir = getCacheDir();
      const pollapoYml = await getPollapoYml();
      const fetchZip = getFetchZip(token);
      const caching = cacheDeps({ cacheDir, pollapoYml, fetchZip });
      for await (const { dep, downloading } of caching) {
        await print(`Downloading ${depToString(dep)}...`);
        await downloading;
        await println("ok");
      }
      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });
      const deps = Object.entries(analyzeDepsResult).map(([repo, revs]) => {
        const latest = Object.keys(revs).sort(compareRev).pop()!;
        return `${repo}@${latest}`;
      }).map(parseDep);
      await emptyDir(options.outDir);
      await Promise.all(deps.map(async (dep) => {
        const zipPath = getZipPath(cacheDir, dep);
        const zipData = await Deno.readFile(zipPath);
        const files = stripComponents(await unzip(zipData), 1);
        await save(path.resolve(options.outDir, dep.user, dep.repo), files);
      }));
      await println("Done.");
    } catch (err) {
      if (err instanceof PollapoYmlNotFoundError) {
        console.error(err.message);
        return Deno.exit(1);
      }
      // TODO: handle not found error
      throw err;
    }
  });

function getFetchZip(token: string) {
  return async function fetchZip(dep: PollapoDep): Promise<Uint8Array> {
    const res = await fetchArchive({ type: "zip", token, ...dep });
    return new Uint8Array(await res.arrayBuffer());
  };
}
