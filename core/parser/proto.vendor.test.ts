import { walk } from "@std/fs/walk";
import { getVendorDir } from "../../cli/pb/config.ts";
import { parse } from "./proto.ts";

const vendorDir = getVendorDir();
try {
  await Deno.lstat(vendorDir);
} catch {
  console.error("Please try `pb vendor install` first.");
  Deno.exit(0);
}

const entries = walk(vendorDir, { includeDirs: false, exts: [".proto"] });
for await (const { path } of entries) {
  Deno.test(`parse ${path}`, async () => {
    const code = await Deno.readTextFile(path);
    parse(code);
  });
}
