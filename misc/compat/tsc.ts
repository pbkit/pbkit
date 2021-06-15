import {
  readAll,
  readAllSync,
  StringReader,
} from "https://deno.land/std@0.98.0/io/mod.ts";

export function removeTsFileExtensionInImportStatement(code: string): string {
  return code.replaceAll(
    /(^\s*(?:import|export|}\s*from)\b.+?)\.ts("|')/gm,
    "$1$2",
  );
}

export async function removeTsFileExtensionInImportStatementFromReader(
  reader: Deno.Reader | Deno.ReaderSync,
): Promise<Deno.Reader> {
  const data = "readSync" in reader
    ? readAllSync(reader)
    : await readAll(reader);
  return new StringReader(
    removeTsFileExtensionInImportStatement(new TextDecoder().decode(data)),
  );
}
