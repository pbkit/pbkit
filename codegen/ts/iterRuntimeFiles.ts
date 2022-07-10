import { walk } from "https://deno.land/std@0.147.0/fs/walk.ts";
import { relative, resolve } from "https://deno.land/std@0.147.0/path/mod.ts";
import { getAutoClosingFileReader } from "../../misc/file.ts";
import { CodeEntry } from "../index.ts";

export default async function* iterRuntimeFiles(): AsyncGenerator<CodeEntry> {
  const __dirname = new URL(".", import.meta.url).pathname;
  const runtimePath: string = resolve(__dirname, "../../core/runtime");
  for await (const { path: filePath } of walk(runtimePath, { exts: [".ts"] })) {
    if (filePath.endsWith(".test.ts")) continue;
    const file = await getAutoClosingFileReader(filePath);
    yield [relative(runtimePath, filePath), file];
  }
}
