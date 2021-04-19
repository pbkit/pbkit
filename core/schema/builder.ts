import { Loader } from "../loader/index.ts";
import { parse } from "../parser/proto.ts";
import { Schema } from "./model.ts";

export interface BuildConfig {
  loader: Loader;
  files: string[];
}
export async function build(config: BuildConfig): Promise<Schema> {
  const result: Schema = {
    files: {},
    types: {},
    extends: {},
    services: {},
  };
  for (const file of config.files) {
    const loadResult = await config.loader.load(file);
    if (!loadResult) continue;
    const parseResult = parse(loadResult.data);
    // result.files[file] = {
    //   parseResult,
    //   // TODO
    // };
  }
  return result;
}
