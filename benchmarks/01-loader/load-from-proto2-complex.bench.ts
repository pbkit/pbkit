import "https://deno.land/x/xhr@0.1.0/mod.ts";

import protobufjs from "npm:protobufjs@6.11.2";
import * as path from "https://deno.land/std@0.175.0/path/mod.ts";
import { getVendorDir } from "../../cli/pb/config.ts";
import { build } from "../../core/schema/builder.ts";
import { createLoader } from "../../core/loader/deno-fs.ts";

const dirname = path.dirname(path.fromFileUrl(import.meta.url));

const protoPath = path.join(dirname, "../data");

function createPbkitLoader() {
  const roots = [protoPath, getVendorDir()];
  const loader = createLoader({ roots });
  return {
    load: (filePath: string) => build({ loader, files: [filePath] }),
  };
}
const pbkitLoader = createPbkitLoader();

async function test_protobufjs() {
  await protobufjs.load(
    "file://" + path.join(protoPath, "file-descriptor.proto"),
  );
}

async function test_pbkit() {
  await pbkitLoader.load("file-descriptor.proto");
}

Deno.bench("protobufjs", test_protobufjs);

Deno.bench("pbkit", { baseline: true }, test_pbkit);
