import { ensureDir } from "https://deno.land/std@0.147.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import JSZip from "https://dev.jspm.io/jszip@3.5.0";
import { stripComponent } from "./index.ts";

export interface Files {
  [fileName: string]: ZipObject;
}
export interface ZipObject {
  name: string;
  dir: boolean;
  date: Date | null;
  comment: string | null;
  unixPermissions: number | null;
  dosPermissions: number | null;
  async(type: "text" | "string"): Promise<string>;
  async(type: "uint8array"): Promise<Uint8Array>;
}

export async function zip(
  files: AsyncGenerator<[string, Uint8Array]>,
): Promise<Uint8Array> {
  const zip = new (JSZip as any)();
  for await (const [name, file] of files) await zip.file(name, file);
  return await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });
}

export async function unzip(zip: Uint8Array): Promise<Files> {
  const { files } = await (JSZip as any).loadAsync(zip);
  return files;
}

export function stripComponents(files: Files, number: number): Files {
  const result: Files = {};
  for (const [fileName, file] of Object.entries(files)) {
    const newFileName = stripComponent(fileName, number);
    if (!newFileName) continue;
    file.name = newFileName;
    result[newFileName] = file;
  }
  return result;
}

export async function save(targetDir: string, files: Files): Promise<void> {
  await Promise.all(
    Object.entries(files).map(async ([fileName, file]) => {
      if (file.dir) return;
      const filePath = path.resolve(targetDir, fileName);
      await ensureDir(path.dirname(filePath));
      await Deno.writeFile(filePath, await file.async("uint8array"));
    }),
  );
}

export async function* iterFiles(files: Files) {
  for (const [fileName, file] of Object.entries(files)) {
    if (file.dir) continue;
    yield { fileName, data: await file.async("uint8array") };
  }
}
