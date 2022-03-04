import { green, yellow } from "https://deno.land/std@0.122.0/fmt/colors.ts";
import ProgressBar from "https://deno.land/x/progress@v1.2.5/mod.ts";
import { subscribeFnToAsyncGenerator } from "../../../../core/runtime/async/observer.ts";
import { progressResponse } from "../../../../misc/fetch.ts";
import { stripComponents, unzip } from "../../../../misc/archive/zip.ts";
import { fetchArchive } from "../../../../misc/github/index.ts";

export interface DownloadRepoAndExtractProtoFilesConfig {
  user: string;
  repo: string;
  rev: string;
  filter?: (file: string) => boolean;
  depth?: number;
  verbose?: boolean;
}
export default async function downloadRepoAndExtractProtoFiles({
  user,
  repo,
  rev,
  filter = (file) => file.endsWith(".proto"),
  depth = 1,
  verbose = true,
}: DownloadRepoAndExtractProtoFilesConfig) {
  const { response, subscribeProgress } = progressResponse(
    await fetchArchive({ type: "zip", user, repo, rev }),
  );
  if (verbose) {
    console.log(green("Downloading"), yellow(`github:${user}/${repo}.zip`));
  }
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
