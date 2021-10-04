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
  const b = new Uint8Array(32 * 1024);
  let acc = 0;
  return {
    async read(p) {
      const n = await zipfs.readPromise(fd, b, 0, p, acc);
      if (n < 1) {
        await zipfs.closePromise(fd);
        return null;
      }
      acc += n;
      return b.slice(0, n);
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
