import { emptyDir, ensureDir } from "https://deno.land/std@0.98.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.98.0/fs/walk.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";

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
    url: "git+https://github.com/riiid/pbkit.git",
  },
};

await ensureDir("tmp/npm/dist");
await Deno.writeTextFile(
  "tmp/npm/dist/package.json",
  JSON.stringify(packageJson, null, 2) + "\n",
);

const entries = walk("core", { includeDirs: false, exts: [".ts"] });
for await (const { path: fromPath } of entries) {
  if (fromPath.endsWith(".test.ts")) continue;
  if (/\bdeno\b/.test(fromPath)) continue;
  const toPath = path.join("tmp/npm/ts", fromPath);
  await ensureDir(path.dirname(toPath));
  const code = await Deno.readTextFile(fromPath);
  await Deno.writeTextFile(
    toPath,
    code.replaceAll(/(^\s*(?:import|export|}\s*from)\b.+?)\.ts("|')/gm, "$1$2"),
  );
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

await Deno.run({ cwd: "tmp/npm/dist", cmd: ["npm", "publish"] }).status();
