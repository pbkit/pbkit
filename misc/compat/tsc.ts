import {
  readAll,
  readAllSync,
} from "https://deno.land/std@0.167.0/streams/read_all.ts";
import { StringReader } from "https://deno.land/std@0.167.0/io/readers.ts";

export function replaceTsFileExtensionInImportStatement(
  code: string,
  extension: string,
): string {
  if (extension === ".ts") return code;
  return code.replaceAll(
    /(^\s*(?:import|export|}\s*from)\b.+?)\.ts("|')/gm,
    `$1${extension}$2`,
  );
}

export async function replaceTsFileExtensionInImportStatementFromReader(
  reader: Deno.Reader | Deno.ReaderSync,
  extension: string,
): Promise<Deno.Reader> {
  const data = "readSync" in reader
    ? readAllSync(reader)
    : await readAll(reader);
  return new StringReader(
    replaceTsFileExtensionInImportStatement(
      new TextDecoder().decode(data),
      extension,
    ),
  );
}
