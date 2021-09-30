import { green, yellow } from "https://deno.land/std@0.107.0/fmt/colors.ts";
import { emptyDir, ensureDir } from "https://deno.land/std@0.107.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.107.0/path/mod.ts";
import ProgressBar from "https://deno.land/x/progress@v1.2.3/mod.ts";
import { subscribeFnToAsyncGenerator } from "../core/misc/async/observer.ts";
import { progressResponse } from "../misc/fetch.ts";
import { iterFiles, stripComponents, unzip } from "../misc/archive/zip.ts";
import { fetchArchive } from "../misc/github/index.ts";

await emptyDir("vendor");

const protoFiles = {
  ...await downloadRepoAndExtractProtoFiles({
    user: "protocolbuffers",
    repo: "protobuf",
    rev: "master",
    filter: (file) =>
      file.startsWith("google/protobuf/") &&
      file.endsWith(".proto"),
    depth: 2,
  }),
  ...await downloadRepoAndExtractProtoFiles({
    user: "googleapis",
    repo: "googleapis",
    rev: "master",
    filter: (file) => file.endsWith(".proto"),
  }),
};

for await (const { fileName, data } of iterFiles(protoFiles)) {
  const savePath = path.join("vendor", fileName);
  console.log(`Writing ${savePath}...`);
  await ensureDir(path.dirname(savePath));
  await Deno.writeFile(savePath, data);
}

interface DownloadRepoAndExtractProtoFilesConfig {
  user: string;
  repo: string;
  rev: string;
  filter?: (file: string) => boolean;
  depth?: number;
}
async function downloadRepoAndExtractProtoFiles({
  user,
  repo,
  rev,
  filter = (file) => file.endsWith(".proto"),
  depth = 1,
}: DownloadRepoAndExtractProtoFilesConfig) {
  const { response, subscribeProgress } = progressResponse(
    await fetchArchive({ type: "zip", user, repo, rev }),
  );
  console.log(green("Downloading"), yellow(`github:${user}/${repo}.zip`));
  const progressBar = new ProgressBar();
  for await (const progress of subscribeFnToAsyncGenerator(subscribeProgress)) {
    progressBar.total = progress.total || 7500000;
    progressBar.render(progress.current);
  }
  const zip = new Uint8Array(await response.arrayBuffer());
  const files = stripComponents(await unzip(zip), depth);
  const protoFiles = Object.fromEntries(
    Object.entries(files).filter(([file]) => filter(file)),
  );
  return protoFiles;
}
