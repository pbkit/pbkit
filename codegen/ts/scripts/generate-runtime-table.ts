import { walk } from "https://deno.land/std@0.167.0/fs/walk.ts";
import {
  fromFileUrl,
  join,
  posix,
  relative,
  win32,
} from "https://deno.land/std@0.167.0/path/mod.ts";

const runtimePath = fromFileUrl(import.meta.resolve("../../../core/runtime"));
const generatedPath = fromFileUrl(import.meta.resolve("../generated"));

const imports: [string, string][] = [];

const entries = walk(runtimePath, {
  includeDirs: false,
  exts: [".ts"],
  skip: [/\.test\.ts$/],
});
for await (const { path } of entries) {
  const importPath = (
    relative(generatedPath, path)
      .replaceAll(win32.sep, posix.sep)
  );
  const tableKey = (
    join("@pbkit/runtime", relative(runtimePath, path))
      .replaceAll(win32.sep, posix.sep)
  );
  imports.push([importPath, tableKey]);
}

const code = [
  imports.map(
    ([importPath], i) => `import * as _${i} from "${importPath}";`,
  ).join("\n"),
  `\nexport default {`,
  imports.map(([, tableKey], i) => `  "${tableKey}": _${i},`).join("\n"),
  `};\n`,
].join("\n");

await Deno.writeTextFile(join(generatedPath, "runtime-table.ts"), code);
