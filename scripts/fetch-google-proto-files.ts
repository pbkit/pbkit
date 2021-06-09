import { green, yellow } from "https://deno.land/std@0.98.0/fmt/colors.ts";
import { emptyDir, ensureDir } from "https://deno.land/std@0.98.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import ProgressBar from "https://deno.land/x/progress@v1.2.3/mod.ts";
import { subscribeFnToAsyncGenerator } from "../misc/observer.ts";
import { progressResponse } from "../misc/fetch.ts";
import { iterFiles, stripComponents, unzip } from "../misc/archive/zip.ts";
import { fetchArchive } from "../misc/github/index.ts";

const { response, subscribeProgress } = progressResponse(
  await fetchArchive({
    type: "zip",
    user: "protocolbuffers",
    repo: "protobuf",
    rev: "master",
  }),
);

console.log(
  green("Downloading"),
  yellow("github:protocolbuffers/protobuf.zip"),
);
const progressBar = new ProgressBar();
for await (const progress of subscribeFnToAsyncGenerator(subscribeProgress)) {
  progressBar.total = progress.total || 7500000;
  progressBar.render(progress.current);
}

const zip = new Uint8Array(await response.arrayBuffer());
const files = stripComponents(await unzip(zip), 2);
const protoFiles = Object.fromEntries(
  Object.entries(files).filter(([file]) => (
    file.startsWith("google/protobuf/") &&
    file.endsWith(".proto")
  )),
);

await emptyDir("vendor/google/protobuf");
for await (const { fileName, data } of iterFiles(protoFiles)) {
  const savePath = path.join("vendor", fileName);
  console.log(`Writing ${savePath}...`);
  await ensureDir(path.dirname(savePath));
  await Deno.writeFile(savePath, data);
}
