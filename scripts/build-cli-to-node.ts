import { build, emptyDir } from "https://deno.land/x/dnt@0.21.1/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: [{ kind: "bin", name: "pb", path: "./cli/pb/entrypoint.ts" }],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
    undici: true,
    custom: [{ module: "stream", globalNames: ["ReadableStream"] }],
  },
  package: {
    // package.json properties
    name: "your-package",
    version: Deno.args[0],
    description: "Your package.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/username/repo.git",
    },
    bugs: {
      url: "https://github.com/username/repo/issues",
    },
  },
  typeCheck: false,
  declaration: false,
  test: false,
});

// post build steps
Deno.copyFileSync("LICENSE-MIT", "npm/LICENSE-MIT");
Deno.copyFileSync("LICENSE-APACHE", "npm/LICENSE-APACHE");
Deno.copyFileSync("README.md", "npm/README.md");
