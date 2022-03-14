import { ensureDir } from "https://deno.land/std@0.122.0/fs/mod.ts";
import { build } from "https://deno.land/x/dnt@0.22.0/mod.ts";
import { BuildConfig, NameAndVersion } from "./index.ts";

if (import.meta.main) {
  buildPbCli({
    name: "@pbkit/pb-cli",
    version: "0.0.0",
    dist: "tmp/npm/pb-cli",
  });
}

export default async function buildPbCli(config: BuildConfig) {
  const packageJson = getPackageJson(config);
  await ensureDir(config.dist);
  await build({
    entryPoints: [{ kind: "bin", name: "pb", path: "cli/pb/entrypoint.ts" }],
    outDir: config.dist,
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
    package: packageJson,
    typeCheck: false,
    declaration: false,
    test: false,
  });
}

export function getPackageJson(config: NameAndVersion) {
  const { name, version } = config;
  return {
    name,
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
  };
}
