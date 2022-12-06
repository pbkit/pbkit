import { walk } from "https://deno.land/std@0.167.0/fs/walk.ts";
import {
  fromFileUrl,
  relative,
} from "https://deno.land/std@0.167.0/path/mod.ts";
import { getAutoClosingFileReader } from "../../misc/file.ts";
import { CodeEntry } from "../index.ts";

export default async function* iterRuntimeFiles(): AsyncGenerator<CodeEntry> {
  const runtimePath: string = fromFileUrl(
    import.meta.resolve("../../core/runtime"),
  );
  for await (const { path: filePath } of walk(runtimePath, { exts: [".ts"] })) {
    if (filePath.endsWith(".test.ts")) continue;
    const file = await getAutoClosingFileReader(filePath);
    yield [relative(runtimePath, filePath), file];
  }
}
