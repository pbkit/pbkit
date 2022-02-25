import { build, emptyDir } from "https://deno.land/x/dnt@0.20.1/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: [{ kind: "bin", name: "pb", path: "./cli/pb/entrypoint.ts" }],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
    
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
  scriptModule: false,
  typeCheck: false,
  declaration: false,
  test: false,
  // mappings: {
  //   "https://esm.sh/vscode-jsonrpc@8.0.0-next.6/lib/common/messages.js": {

  //   }
  // },
});

// post build steps
Deno.copyFileSync("LICENSE-MIT", "npm/LICENSE-MIT");
Deno.copyFileSync("LICENSE-APACHE", "npm/LICENSE-APACHE");
Deno.copyFileSync("README.md", "npm/README.md");
