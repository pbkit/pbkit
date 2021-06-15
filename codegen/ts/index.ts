import { walk } from "https://deno.land/std@0.98.0/fs/walk.ts";
import {
  join,
  relative,
  resolve,
} from "https://deno.land/std@0.98.0/path/mod.ts";
import { Schema } from "../../core/schema/model.ts";
import { removeTsFileExtensionInImportStatementFromReader } from "../../misc/compat/tsc.ts";
import { getAutoClosingFileReader } from "../../misc/file.ts";
import { CodeEntry } from "../index.ts";
import genMessages from "./messages.ts";

export interface GenConfig {
  removeTsFileExtensionInImportStatement?: boolean;
}
export default async function* gen(
  schema: Schema,
  config: GenConfig = {},
): AsyncGenerator<CodeEntry> {
  const removeDotTs = !!config.removeTsFileExtensionInImportStatement;
  const removeDotTsFn = removeTsFileExtensionInImportStatementFromReader;
  // copy runtime files
  for await (const { path: filePath } of walk(runtimePath, { exts: [".ts"] })) {
    if (filePath.endsWith(".test.ts")) continue;
    const file = await getAutoClosingFileReader(filePath);
    yield [
      join("runtime", relative(runtimePath, filePath)),
      removeDotTs ? await removeDotTsFn(file) : file,
    ];
  }
  // gen messages
  for (const [filePath, data] of genMessages(schema, config)) {
    yield [filePath, removeDotTs ? await removeDotTsFn(data) : data];
  }
  // TODO: services
}

const __dirname = new URL(".", import.meta.url).pathname;
const runtimePath: string = resolve(__dirname, "../../core/runtime");
