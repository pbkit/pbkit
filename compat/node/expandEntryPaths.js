const { relative } = require("path");
const { walk } = require("./zipfs");

async function expandEntryPaths(entryPaths) {
  const result = [];
  for (const entryPath of entryPaths) {
    for await (const path of walk(entryPath)) {
      if (!path.endsWith(".proto")) continue;
      result.push(relative(entryPath, path));
    }
  }
  return result;
}
exports.default = expandEntryPaths;
