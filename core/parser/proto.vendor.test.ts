import { walk } from "https://deno.land/std@0.107.0/fs/walk.ts";
import { getVendorDir } from "../../cli/pb/config.ts";
import { parse } from "./proto.ts";

const entries = walk(getVendorDir(), { includeDirs: false, exts: [".proto"] });
for await (const { path } of entries) {
  Deno.test(`parse ${path}`, async () => {
    const code = await Deno.readTextFile(path);
    parse(code);
  });
}
