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

export async function unzip(zip: Uint8Array): Promise<Files> {
  const { files } = await (JSZip as any).loadAsync(zip);
  return files;
}

export function stripComponents(files: Files, number: number): Files {
  const result: Files = {};
  for (const fileName in files) {
    const file = files[fileName];
    const newFileName = stripComponent(fileName, number);
    if (!newFileName) continue;
    file.name = newFileName;
    result[newFileName] = file;
  }
  return result;
}
