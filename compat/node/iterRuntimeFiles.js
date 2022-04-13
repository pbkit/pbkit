const { relative } = require("path");
const { runtimeZipPath } = require("./zip-path");
const { createReader, walk } = require("./zipfs");

async function* iterRuntimeFiles() {
  for await (const filePath of walk(runtimeZipPath)) {
    if (!filePath.endsWith(".ts")) continue;
    if (filePath.endsWith(".test.ts")) continue;
    const file = await createReader(filePath);
    yield [relative(runtimeZipPath, filePath), file];
  }
}
exports.default = iterRuntimeFiles;
