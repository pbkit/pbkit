import { ensureDir } from "https://deno.land/std@0.101.0/fs/mod.ts";
import { copy } from "https://deno.land/std@0.101.0/io/util.ts";
import * as path from "https://deno.land/std@0.101.0/path/mod.ts";

export type CodeEntry = [filePath: string, data: Deno.Reader | Deno.ReaderSync];
export type SyncCodeEntry = [filePath: string, data: Deno.ReaderSync];
export type AsyncCodeEntry = [filePath: string, data: Deno.Reader];

export async function save(
  outDir: string,
  files: AsyncGenerator<CodeEntry>,
): Promise<void> {
  const asyncEntries: AsyncCodeEntry[] = [];
  for await (const codeEntry of files) {
    const [filePath, file] = codeEntry;
    const outPath = path.resolve(outDir, filePath);
    await ensureDir(path.dirname(outPath));
    if ("readSync" in file) {
      const outFile = await Deno.create(outPath);
      await copy({ read: async (p) => file.readSync(p) }, outFile);
      outFile.close();
    } else {
      asyncEntries.push(codeEntry as AsyncCodeEntry);
    }
  }
  await Promise.all(asyncEntries.map(async ([filePath, file]) => {
    const outPath = path.resolve(outDir, filePath);
    const outFile = await Deno.create(outPath);
    await copy(file, outFile);
    outFile.close();
  }));
}
