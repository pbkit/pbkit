const { join } = require("path");
const { ZipOpenFS, PosixFS } = require("@yarnpkg/fslib");
const { getLibzipSync } = require("@yarnpkg/libzip");

const zipfs = new PosixFS(
  new ZipOpenFS({
    libzip: getLibzipSync(),
    useCache: true,
    maxOpenFiles: 80,
  }),
);

async function createReader(filePath) {
  const fd = await zipfs.openPromise(filePath, "r");
  return {
    async read(p) {
      const n = await zipfs.readPromise(fd, p, 0);
      if (isNaN(n) || n == 0) {
        await zipfs.closePromise(fd);
        return null;
      }
      return n;
    },
  };
}
exports.createReader = createReader;

async function exists(filePath) {
  return await zipfs.existsPromise(filePath);
}
exports.exists = exists;

async function readFile(filePath) {
  return await zipfs.readFilePromise(filePath);
}
exports.readFile = readFile;

async function readTextFile(filePath) {
  return await zipfs.readFilePromise(filePath, "utf8");
}
exports.readTextFile = readTextFile;

async function* walk(dir) {
  for await (const d of await zipfs.opendirPromise(dir)) {
    const entry = join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    if (d.isFile()) yield entry;
  }
}
exports.walk = walk;
