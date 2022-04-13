const fs = require("fs/promises");

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
exports.exists = exists;

async function ensureDir(path) {
  if (await exists(path)) return;
  await fs.mkdir(path, { recursive: true });
}
exports.ensureDir = ensureDir;
