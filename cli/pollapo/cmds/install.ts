import { stringify } from "https://deno.land/std@0.98.0/encoding/yaml.ts";
import { green, red, yellow } from "https://deno.land/std@0.98.0/fmt/colors.ts";
import { emptyDir, ensureDir } from "https://deno.land/std@0.98.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";
import { parse } from "../../../core/parser/proto.ts";
import minify from "../../../core/stringifier/minify.ts";
import replaceFileOption from "../postprocess/replaceFileOption.ts";
import backoff from "../misc/exponential-backoff.ts";
import {
  getToken,
  GithubNotLoggedInError,
  GithubRepoNotFoundError,
} from "../../../misc/github/index.ts";
import {
  iterFiles,
  stripComponents,
  unzip,
} from "../../../misc/archive/zip.ts";
import { print, println } from "../misc/stdio.ts";
import { getCacheDir } from "../config.ts";
import {
  analyzeDeps,
  AnalyzeDepsResultRevs,
  cacheDeps,
  depToString,
  getFetchCommitHash,
  getFetchZip,
  getZipPath,
  loadPollapoYml,
  lock,
  parseDep,
  PollapoRootLockTable,
  PollapoYml,
  PollapoYmlMalformedError,
  PollapoYmlNotFoundError,
  sanitizeDeps,
} from "../pollapoYml.ts";
import { compareRev } from "../rev.ts";
import {
  PollapoUnauthorizedError,
  validateToken,
} from "../../../misc/github/auth.ts";
import { Confirm } from "https://deno.land/x/cliffy@v0.18.0/prompt/confirm.ts";

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
      const outDir = pollapoYml?.outDir ?? options.outDir;
      const caching = cacheDeps({
        cacheDir,
        clean: !!options.clean,
        pollapoYml,
        fetchCommitHash: getFetchCommitHash(token),
        fetchZip: getFetchZip(token),
      });
      const lockTable: PollapoRootLockTable = {};
      for await (const task of caching) {
        const depString = depToString(task.dep);
        if (task.type === "use-cache") {
          await println(`Use cache of ${yellow(depString)}.`);
          await task.promise;
        } else if (task.type === "use-locked-commit-hash") {
          await println(`Use locked commit hash of ${yellow(depString)}.`);
          const commitHash = await task.promise;
          lockTable[depString] = commitHash;
        } else if (task.type === "check-commit-hash") {
          await print(`Checking commit hash of ${yellow(depString)}...`);
          const commitHash = await task.promise;
          lockTable[depString] = commitHash;
          await println(green("ok"));
        } else if (task.type === "download") {
          await print(`Downloading ${yellow(depString)}...`);
          await task.promise;
          await println(green("ok"));
        }
      }
      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });
      await emptyDir(outDir);
      for (const [repo, revs] of Object.entries(analyzeDepsResult)) {
        await installDep(options, cacheDir, pollapoYml, repo, revs);
      }
      const pollapoYmlText = stringify(
        sanitizeDeps({
          ...pollapoYml,
          outDir,
          root: { ...pollapoYml?.root, lock: lockTable },
        }) as Record<string, unknown>,
      );
      await Deno.writeTextFile(options.config, pollapoYmlText);
      await println("Done.");
    } catch (err) {
      if (
        err instanceof GithubNotLoggedInError ||
        err instanceof GithubRepoNotFoundError ||
        err instanceof PollapoUnauthorizedError ||
        err instanceof PollapoYmlMalformedError ||
        err instanceof PollapoYmlNotFoundError
      ) {
        await println(red("error"));
        await println(err.message);
        if (err instanceof PollapoYmlNotFoundError) {
          const confirmed = await Confirm.prompt(
            `Create ${path.resolve("pollapo.yml")}?`,
          );
          if (confirmed) await Deno.create(path.resolve("pollapo.yml"));
        }
        return Deno.exit(1);
      }
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
  const lockTable = pollapoYml?.root?.lock ?? {};
  const latest = Object.keys(revs).sort(compareRev).pop()!;
  const dep = lock(lockTable, parseDep(`${repo}@${latest}`));
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
