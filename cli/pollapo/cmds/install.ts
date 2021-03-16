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
  clean?: true;
  outDir: string;
  token?: string;
}

export default new Command()
  .description("Install dependencies.")
  .option("-c, --clean", "Don't use cache")
  .option("-o, --out-dir <value:string>", "Out directory", {
    default: ".pollapo",
  })
  .option("-t, --token <value:string>", "GitHub OAuth token")
  .action(async (options: Options) => {
    try {
      const token = options.token ?? await getToken();
      const cacheDir = getCacheDir();
      const pollapoYml = await getPollapoYml();
      const fetchZip = getFetchZip(token);
      const caching = cacheDeps({
        cacheDir,
        clean: !!options.clean,
        pollapoYml,
        fetchZip,
      });
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
      if (
        err instanceof PollapoNotLoggedInError ||
        err instanceof PollapoYmlNotFoundError
      ) {
        console.error(err.message);
        return Deno.exit(1);
      }
      // TODO: handle not found error
      throw err;
    }
  });

class PollapoNotLoggedInError extends Error {
  constructor() {
    super("Login required.");
  }
}

async function getToken(): Promise<string> {
  try {
    const ghHosts = await readGhHosts();
    const token = ghHosts["github.com"].oauth_token;
    if (token) return token;
  } catch {}
  throw new PollapoNotLoggedInError();
}

function getFetchZip(token: string) {
  return async function fetchZip(dep: PollapoDep): Promise<Uint8Array> {
    const res = await fetchArchive({ type: "zip", token, ...dep });
    return new Uint8Array(await res.arrayBuffer());
  };
}
