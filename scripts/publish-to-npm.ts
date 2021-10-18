import { emptyDir, ensureDir } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.107.0/fs/walk.ts";
import {
  dirname,
  join,
  relative,
} from "https://deno.land/std@0.107.0/path/mod.ts";
import { replaceTsFileExtensionInImportStatement } from "../misc/compat/tsc.ts";
import { zip } from "../misc/archive/zip.ts";
import { getVendorDir } from "../cli/pb/config.ts";

await emptyDir("tmp/npm");

const latestTag = new TextDecoder().decode(
  await Deno.run({
    cmd: ["git", "describe", "--tags", "--abbrev=0"],
    stdout: "piped",
  }).output(),
);
const version = latestTag.substr(1).trim();

const packageJson = {
  name: "pbkit",
  version,
  author: "JongChan Choi <jong@chan.moe>",
  license: "(MIT OR Apache-2.0)",
  repository: {
    type: "git",
    url: "git+https://github.com/pbkit/pbkit.git",
  },
  bin: { "pb-gen-ts": "node/cli/pb-gen-ts.js" },
  preferUnplugged: true,
  dependencies: {
    "@yarnpkg/fslib": "^2.6.0-rc.8",
    "@yarnpkg/libzip": "^2.2.2",
    "core-js": "3.18.1",
    mri: "^1.2.0",
  },
};

await ensureDir("tmp/npm/dist");
await Deno.writeTextFile(
  "tmp/npm/dist/package.json",
  JSON.stringify(packageJson, null, 2) + "\n",
);

{ // copy core files
  const entries = walk("core", { includeDirs: false, exts: [".ts"] });
  for await (const { path: fromPath } of entries) {
    if (fromPath.endsWith(".test.ts")) continue;
    if (/\bdeno\b/.test(fromPath)) continue;
    const toPath = join("tmp/npm/ts", fromPath);
    await ensureDir(dirname(toPath));
    const code = await Deno.readTextFile(fromPath);
    await Deno.writeTextFile(
      toPath,
      replaceTsFileExtensionInImportStatement(code, ""),
    );
  }
}

{ // tsc
  const entries = walk("tmp/npm/ts", { includeDirs: false, exts: [".ts"] });
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
      "tmp/npm/ts",
      "--outDir",
      "tmp/npm/dist",
      ...tsFiles,
    ],
  }).status();
}

{ // bundle codegen logic
  await ensureDir("tmp/npm/dist/codegen/ts");
  await Deno.run({
    cmd: [
      "deno",
      "bundle",
      "--unstable",
      "codegen/ts/index.ts",
      "tmp/npm/dist/codegen/ts/index.mjs",
    ],
  }).status();
}

{ // copy nodejs-specific files
  const entries = walk("node", { includeDirs: false, exts: [".js"] });
  for await (const { path: fromPath } of entries) {
    const toPath = join("tmp/npm/dist", fromPath);
    await ensureDir(dirname(toPath));
    const code = await Deno.readTextFile(fromPath);
    await Deno.writeTextFile(toPath, code);
  }
}

await Deno.writeFile(
  "tmp/npm/dist/runtime.zip",
  await zip(filesInDir("core/runtime", ".ts", (p) => !p.endsWith(".test.ts"))),
);

console.log("writing 'vendor.zip'. it takes few minutes...");
await Deno.writeFile(
  "tmp/npm/dist/vendor.zip",
  await zip(filesInDir(getVendorDir(), ".proto")),
);

await Deno.run({
  cwd: "tmp/npm/dist",
  cmd: ["npm", "publish"],
}).status();

const runtimePackageJson = {
  name: "@pbkit/runtime",
  version,
  author: "JongChan Choi <jong@chan.moe>",
  license: "(MIT OR Apache-2.0)",
  repository: {
    type: "git",
    url: "git+https://github.com/pbkit/pbkit.git",
  },
};

await ensureDir("tmp/npm/dist-runtime");
await Deno.writeTextFile(
  "tmp/npm/dist-runtime/package.json",
  JSON.stringify(runtimePackageJson, null, 2) + "\n",
);

await Deno.run({
  cwd: "tmp/npm",
  cmd: ["cp", "-R", "dist/core/runtime/", "dist-runtime"],
}).status();
await Deno.run({
  cwd: "tmp/npm/dist-runtime",
  cmd: ["npm", "publish"],
}).status();

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
