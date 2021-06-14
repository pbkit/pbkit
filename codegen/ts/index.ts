import { walk } from "https://deno.land/std@0.98.0/fs/walk.ts";
import {
  join,
  relative,
  resolve,
} from "https://deno.land/std@0.98.0/path/mod.ts";
import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import { Schema } from "../../core/schema/model.ts";
import { removeTsFileExtensionInImportStatement } from "../../misc/compat/tsc.ts";
import { getAutoClosingFileReader } from "../../misc/file.ts";

export interface GenConfig {
  removeTsFileExtensionInImportStatement?: boolean;
}
export default async function* gen(
  schema: Schema,
  config: GenConfig = {},
): AsyncGenerator<[string, Deno.Reader]> {
  const removeDotTs = !!config.removeTsFileExtensionInImportStatement;
  // copy runtime files
  for await (const { path: filePath } of walk(runtimePath, { exts: [".ts"] })) {
    if (filePath.endsWith(".test.ts")) continue;
    const file = await getAutoClosingFileReader(filePath);
    yield [
      join("runtime", relative(runtimePath, filePath)),
      removeDotTs ? file : await removeTsFileExtensionInImportStatement(file),
    ];
  }
  // TODO: messages, services
}

const __dirname = new URL(".", import.meta.url).pathname;
export const runtimePath: string = resolve(__dirname, "../../core/runtime");
