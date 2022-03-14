import { emptyDir } from "https://deno.land/std@0.122.0/fs/mod.ts";
import buildCore from "./buildCore.ts";
import buildRuntime from "./buildRuntime.ts";
import buildPbCli from "./buildPbCli.ts";

await emptyDir("tmp/npm");

const latestTag = new TextDecoder().decode(
  await Deno.run({
    cmd: ["git", "describe", "--tags", "--abbrev=0"],
    stdout: "piped",
  }).output(),
);
const version = latestTag.slice(1).trim();

await Promise.all([
  buildCore({
    name: "pbkit",
    version,
    dist: "tmp/npm/pbkit",
    tmp: "tmp/npm/tmp/pbkit",
  }),
  buildRuntime({
    name: "@pbkit/runtime",
    version,
    dist: "tmp/npm/runtime",
    tmp: "tmp/npm/tmp/runtime",
  }),
  buildPbCli({
    name: "@pbkit/pb-cli",
    version,
    dist: "tmp/npm/pb-cli",
  }),
]);
