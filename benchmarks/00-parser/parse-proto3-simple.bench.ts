import protobufjs from "https://esm.sh/protobufjs@6.11.2";
import * as path from "https://deno.land/std@0.129.0/path/mod.ts";
import * as pbkit from "../../core/parser/proto.ts";

const dirname = path.dirname(path.fromFileUrl(import.meta.url));

const proto = Deno.readTextFileSync(
  path.resolve(dirname, "../data/simple.proto"),
);

function test_protobufjs() {
  protobufjs.parse(proto, { keepCase: true });
}

function test_pbkit() {
  pbkit.parse(proto);
}

Deno.bench("protobufjs", test_protobufjs);

Deno.bench("pbkit", { baseline: true }, test_pbkit);
