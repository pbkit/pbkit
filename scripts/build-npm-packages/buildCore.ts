import { ensureDir } from "https://deno.land/std@0.147.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.147.0/fs/walk.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.43/mod.js";
import { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.5.0/mod.ts";
import {
  dirname,
  join,
  relative,
} from "https://deno.land/std@0.147.0/path/mod.ts";
import { replaceTsFileExtensionInImportStatement } from "../../misc/compat/tsc.ts";
import { zip } from "../../misc/archive/zip.ts";
import { getVendorDir } from "../../cli/pb/config.ts";
import { BuildConfig, NameAndVersion } from "./index.ts";

if (import.meta.main) {
  buildCore({
    name: "pbkit",
    version: "0.0.0",
    dist: "tmp/npm/pbkit",
    tmp: "tmp/npm/tmp/pbkit",
  });
}

export default async function buildCore(config: BuildConfig) {
  const packageJson = getPackageJson(config);
  const tsDir = `${config.tmp}/ts`;
  await ensureDir(config.dist);
  await Deno.writeTextFile(
    `${config.dist}/package.json`,
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  await Promise.all([
    Deno.copyFile("LICENSE-MIT", `${config.dist}/LICENSE-MIT`),
    Deno.copyFile("LICENSE-APACHE", `${config.dist}/LICENSE-APACHE`),
    Deno.copyFile("README.md", `${config.dist}/README.md`),
  ]);
  { // copy core files
    const entries = walk("core", { includeDirs: false, exts: [".ts"] });
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
    const entries = walk(tsDir, { includeDirs: false, exts: [".ts"] });
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
        tsDir,
        "--outDir",
        config.dist,
        ...tsFiles,
      ],
    }).status();
  }
  { // bundle codegen logic
    await ensureDir(`${config.dist}/codegen/ts`);
    await esbuild.build({
      plugins: [denoPlugin()],
      bundle: true,
      entryPoints: [`codegen/ts/index.ts`],
      outfile: `${config.dist}/codegen/ts/index.mjs`,
      target: "node14",
      format: "esm",
    });
    esbuild.stop();
  }
  { // copy nodejs-specific files
    const entries = walk("compat/node", { includeDirs: false, exts: [".js"] });
    for await (const { path: fromPath } of entries) {
      const toPath = join(config.dist, fromPath);
      await ensureDir(dirname(toPath));
      const code = await Deno.readTextFile(fromPath);
      await Deno.writeTextFile(toPath, code);
    }
  }
  await Deno.writeFile(
    `${config.dist}/runtime.zip`,
    await zip(
      filesInDir("core/runtime", ".ts", (p) => !p.endsWith(".test.ts")),
    ),
  );
  console.log("writing 'vendor.zip'. it takes few minutes...");
  await Deno.writeFile(
    `${config.dist}/vendor.zip`,
    await zip(filesInDir(getVendorDir(), ".proto")),
  );
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
    bin: {
      "pb-gen-ts": "compat/node/cli/pb-gen-ts.js",
      "pb-gen-ts-bundle": "compat/node/cli/pb-gen-ts-bundle.js",
    },
    preferUnplugged: true,
    dependencies: {
      "@yarnpkg/fslib": "^2.6.0-rc.8",
      "@yarnpkg/libzip": "^2.2.2",
      "core-js": "3.18.1",
      mri: "^1.2.0",
    },
  };
}

async function* filesInDir(
  dir: string,
  ext: string,
  filter?: (path: string) => boolean,
): AsyncGenerator<[string, Uint8Array]> {
  const entries = walk(dir, { includeDirs: false, exts: [ext] });
  for await (const { path } of entries) {
    if (filter && !filter(path)) continue;
    const file = await Deno.readFile(path);
    yield [relative(dir, path), file];
  }
}
