import { ensureDir } from "https://deno.land/std@0.122.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.122.0/fs/walk.ts";
import { dirname, join } from "https://deno.land/std@0.122.0/path/mod.ts";
import { replaceTsFileExtensionInImportStatement } from "../../misc/compat/tsc.ts";
import { BuildConfig, NameAndVersion } from "./index.ts";

if (import.meta.main) {
  buildRuntime({
    name: "@pbkit/runtime",
    version: "0.0.0",
    dist: "tmp/npm/runtime",
    tmp: "tmp/npm/tmp/runtime",
  });
}

export default async function buildRuntime(config: BuildConfig) {
  const packageJson = getPackageJson(config);
  const tsDir = `${config.tmp}/ts`;
  const runtimeDir = `${tsDir}/core/runtime`;
  await ensureDir(config.dist);
  await Deno.writeTextFile(
    `${config.dist}/package.json`,
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  { // copy runtime files
    const entries = walk("core/runtime", { includeDirs: false, exts: [".ts"] });
    for await (const { path: fromPath } of entries) {
      if (fromPath.endsWith(".test.ts")) continue;
      if (/\bdeno\b/.test(fromPath)) continue;
      const toPath = join(tsDir, fromPath);
      await ensureDir(dirname(toPath));
      const code = await Deno.readTextFile(fromPath);
      await Deno.writeTextFile(
        toPath,
        replaceTsFileExtensionInImportStatement(code, ""),
      );
    }
  }
  { // tsc
    const entries = walk(runtimeDir, { includeDirs: false, exts: [".ts"] });
    const tsFiles: string[] = [];
    for await (const { path } of entries) tsFiles.push(path);
    await Deno.run({
      cmd: [
        "tsc",
        "-m",
        "commonjs",
        "--target",
        "es2019",
        "--lib",
        "es2019,dom",
        "--declaration",
        "--rootDir",
        runtimeDir,
        "--outDir",
        config.dist,
        ...tsFiles,
      ],
    }).status();
  }
}

export function getPackageJson(config: NameAndVersion) {
  const { name, version } = config;
  return {
    name,
    version,
    author: "JongChan Choi <jong@chan.moe>",
    license: "(MIT OR Apache-2.0)",
    repository: {
      type: "git",
      url: "git+https://github.com/pbkit/pbkit.git",
    },
  };
}
