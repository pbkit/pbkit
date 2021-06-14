export async function getAutoClosingFileReader(
  path: Parameters<typeof Deno.open>[0],
): Promise<Deno.Reader> {
  const file = await Deno.open(path, { read: true });
  return {
    async read(p) {
      const bytes = await file.read(p);
      if (bytes == null) file.close();
      return bytes;
    },
  };
}
