import { readAll, StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";

export async function removeTsFileExtensionInImportStatement(
  reader: Deno.Reader,
): Promise<Deno.Reader> {
  const code = new TextDecoder().decode(await readAll(reader));
  return new StringReader(
    code.replaceAll(/(^\s*(?:import|export|}\s*from)\b.+?)\.ts("|')/gm, "$1$2"),
  );
}
