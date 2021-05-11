import { emptyDir, ensureDir } from "https://deno.land/std@0.93.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.93.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { parse } from "../../../core/parser/proto.ts";
import minify from "../../../core/stringifier/minify.ts";
import replaceFileOption from "../postprocess/replaceFileOption.ts";
import backoff from "../misc/exponential-backoff.ts";
import {
  fetchArchive,
  getToken,
  PollapoNotLoggedInError,
} from "../misc/github.ts";
import { iterFiles, stripComponents, unzip } from "../misc/archive/zip.ts";
import { print, println } from "../misc/stdio.ts";
import { getCacheDir } from "../config.ts";
import {
  analyzeDeps,
  AnalyzeDepsResultRevs,
  cacheDeps,
  depToString,
  getZipPath,
  loadPollapoYml,
  parseDep,
  PollapoDep,
  PollapoYml,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";
import { compareRev } from "../rev.ts";
import {
  PollapoUnauthorizedError,
  validateToken,
} from "../misc/github-auth.ts";

interface Options {
  clean?: true;
  outDir: string;
  token?: string;
  config: string;
}

export default new Command()
  .description("Install dependencies.")
  .option("-c, --clean", "Don't use cache")
  .option("-o, --out-dir <value:string>", "Out directory", {
    default: ".pollapo",
  })
  .option("-t, --token <value:string>", "GitHub OAuth token")
  .option("-C, --config <value:string>", "Pollapo config", {
    default: "pollapo.yml",
  })
  .action(async (options: Options) => {
    try {
      const token = options.token ?? await getToken();
      await backoff(
        () => validateToken(token),
        (err, i) => err instanceof PollapoUnauthorizedError || i >= 2,
      );
      const cacheDir = getCacheDir();
      const pollapoYml = await loadPollapoYml(options.config);
      const caching = cacheDeps({
        cacheDir,
        clean: !!options.clean,
        pollapoYml,
        fetchZip: getFetchZip(token),
      });
      for await (const { dep, downloading } of caching) {
        await print(`Downloading ${depToString(dep)}...`);
        await downloading;
        await println("ok");
      }
      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });
      await emptyDir(options.outDir);
      for (const [repo, revs] of Object.entries(analyzeDepsResult)) {
        await installDep(options, cacheDir, pollapoYml, repo, revs);
      }
      await println("Done.");
    } catch (err) {
      if (
        err instanceof PollapoNotLoggedInError ||
        err instanceof PollapoYmlNotFoundError ||
        err instanceof PollapoUnauthorizedError
      ) {
        console.error(err.message);
        return Deno.exit(1);
      }
      // TODO: handle not found error
      throw err;
    }
  });

async function installDep(
  options: Options,
  cacheDir: string,
  pollapoYml: PollapoYml,
  repo: string,
  revs: AnalyzeDepsResultRevs,
): Promise<void> {
  const latest = Object.keys(revs).sort(compareRev).pop()!;
  const dep = parseDep(`${repo}@${latest}`);
  const zipPath = getZipPath(cacheDir, dep);
  const zipData = await Deno.readFile(zipPath);
  const files = stripComponents(await unzip(zipData), 1);
  const targetDir = path.resolve(options.outDir, dep.user, dep.repo);
  const pollapoRootReplaceFileOption = (
    pollapoYml?.root?.["replace-file-option"]
  );
  for await (let { fileName, data } of iterFiles(files)) {
    if (fileName.endsWith(".proto") && pollapoRootReplaceFileOption) {
      const textDecoder = new TextDecoder();
      const textEncoder = new TextEncoder();
      const text = textDecoder.decode(data);
      let { ast } = parse(text);
      ast = replaceFileOption(ast, pollapoRootReplaceFileOption);
      data = textEncoder.encode(minify(ast));
    }
    const filePath = path.resolve(targetDir, fileName);
    await ensureDir(path.dirname(filePath));
    await Deno.writeFile(filePath, data);
  }
}

function getFetchZip(token: string) {
  return async function fetchZip(dep: PollapoDep): Promise<Uint8Array> {
    const res = await backoff(() =>
      fetchArchive({ type: "zip", token, ...dep })
    );
    return new Uint8Array(await res.arrayBuffer());
  };
}
