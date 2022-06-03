import "https://deno.land/x/xhr@0.1.0/mod.ts";

import protobufjs from "https://esm.sh/protobufjs@6.11.2";
import * as path from "https://deno.land/std@0.129.0/path/mod.ts";
import * as pbkit_Simple from "../data/gen/messages/Simple.ts";

const dirname = path.dirname(path.fromFileUrl(import.meta.url));

const protoPath = path.join(dirname, "../data");
const protobufjs_Simple = (await protobufjs.load(
  "file://" + path.join(protoPath, "simple.proto"),
)).lookupType("Simple");

const bin = Deno.readFileSync(path.resolve(dirname, "../data/simple.bin"));

// Note: They are compatible at the only binary level. The JSON payload may be different.
const pbkit_data = pbkit_Simple.decodeBinary(bin);
const protobufjs_data = protobufjs_Simple.decode(bin);

async function test_protobufjs() {
  protobufjs_Simple.encode(protobufjs_data).finish();
}

async function test_pbkit() {
  pbkit_Simple.encodeBinary(pbkit_data);
}

Deno.bench("protobufjs", test_protobufjs);

Deno.bench("pbkit", { baseline: true }, test_pbkit);
