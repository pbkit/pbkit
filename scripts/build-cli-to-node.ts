import { build, emptyDir } from "https://deno.land/x/dnt@0.22.0/mod.ts";

const latestTag = new TextDecoder().decode(
  await Deno.run({
    cmd: ["git", "describe", "--tags", "--abbrev=0"],
    stdout: "piped",
  }).output(),
);
const version = latestTag.substr(1).trim();

await emptyDir("tmp/npm/dist-pb-cli");

await build({
  entryPoints: [{ kind: "bin", name: "pb", path: "./cli/pb/entrypoint.ts" }],
  outDir: "tmp/npm/dist-pb-cli",
  shims: {
    deno: true,
    custom: [{
      package: {
        name: "web-streams-polyfill",
        version: "^3.2.0",
        subPath: "dist/ponyfill.mjs",
      },
      globalNames: ["ReadableStream"],
    }, {
      package: {
        name: "undici",
        version: "^4.15.1",
        subPath: "lib/fetch/headers.js",
      },
      globalNames: ["Headers"],
    }],
  },
  package: {
    name: "@pbkit/pb-cli",
    version,
    description: "Protobuf schema compiler",
    author: "JongChan Choi <jong@chan.moe>",
    license: "(MIT OR Apache-2.0)",
    repository: {
      type: "git",
      url: "git+https://github.com/pbkit/pbkit.git",
    },
    bugs: {
      url: "https://github.com/pbkit/pbkit/issues",
    },
  },
  typeCheck: false,
  declaration: false,
  test: false,
});

// post build steps
Deno.copyFileSync("LICENSE-MIT", "tmp/npm/dist-pb-cli/LICENSE-MIT");
Deno.copyFileSync("LICENSE-APACHE", "tmp/npm/dist-pb-cli/LICENSE-APACHE");
Deno.copyFileSync("README.md", "tmp/npm/dist-pb-cli/README.md");
