import { ensureDir } from "https://deno.land/std@0.167.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import {
  fetchArchive,
  GithubRepoNotFoundError,
} from "../../misc/github/index.ts";
import { iterFiles, stripComponents, unzip } from "../../misc/archive/zip.ts";
import { getVersionsDir } from "./config.ts";

export default async function download(rev: string): Promise<void> {
  try {
    console.log(`Downloading ${rev}...`);
    const res = await fetchArchive({
      type: "zip",
      user: "pbkit",
      repo: "pbkit",
      rev,
    });
    const zip = new Uint8Array(await res.arrayBuffer());
    const files = stripComponents(await unzip(zip), 1);
    const targetDir = path.resolve(getVersionsDir(), rev);
    const promises = [];
    for await (let { fileName, data } of iterFiles(files)) {
      const filePath = path.resolve(targetDir, fileName);
      promises.push(
        ensureDir(path.dirname(filePath))
          .then(() => Deno.writeFile(filePath, data)),
      );
    }
    await Promise.all(promises);
  } catch (err) {
    if (err instanceof GithubRepoNotFoundError) {
      console.error(`Version ${rev} not found.`);
      Deno.exit(1);
    } else {
      throw err;
    }
  }
}
