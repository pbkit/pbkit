const { resolve } = require("path");
const { exists, readTextFile } = require("./zipfs");

function createLoader({ roots }) {
  return {
    async load(path) {
      for (const root of roots) {
        const absolutePath = resolve(root, path);
        if (!await exists(absolutePath)) continue;
        return {
          absolutePath,
          data: await readTextFile(absolutePath),
        };
      }
      return null;
    },
  };
}
exports.default = createLoader;
