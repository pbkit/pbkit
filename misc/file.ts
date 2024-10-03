import type { Reader } from "./io.ts";

export async function getAutoClosingFileReader(
  path: Parameters<typeof Deno.open>[0],
): Promise<Reader> {
  const file = await Deno.open(path, { read: true });
  return {
    async read(p) {
      const bytes = await file.read(p);
      if (bytes == null) file.close();
      return bytes;
    },
  };
}
