const { createWriteStream } = require("fs");
const { dirname, resolve } = require("path");
const { promisify } = require("util");
const stream = require("stream");
const { ensureDir } = require("./fs");

const finished = promisify(stream.finished);

async function save(outDir, files) {
  const asyncEntries = [];
  for await (const codeEntry of files) {
    const [filePath, file] = codeEntry;
    const outPath = resolve(outDir, filePath);
    await ensureDir(dirname(outPath));
    if ("readSync" in file) {
      await saveOne(outPath, { read: async (p) => file.readSync(p) });
    } else {
      asyncEntries.push(codeEntry);
    }
  }
  await Promise.all(asyncEntries.map(async ([filePath, file]) => {
    const outPath = resolve(outDir, filePath);
    await saveOne(outPath, file);
  }));
}
exports.default = save;

async function saveOne(outPath, reader) {
  let gotEOF = false;
  const writable = createWriteStream(outPath);
  try {
    while (!gotEOF) {
      const b = new Uint8Array(32 * 1024);
      const result = await reader.read(b);
      if (result == null) {
        gotEOF = true;
      } else {
        writable.write(b.subarray(0, result));
      }
    }
  } finally {
    writable.end();
  }
  await finished(writable);
}
