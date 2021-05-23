import { Untar } from "https://deno.land/std@0.93.0/archive/tar.ts";
import { gunzip } from "https://deno.land/x/denoflate@1.1/mod.ts";
import { stripComponent } from "./index.ts";

type ExtractTarEntry<T> = T extends Promise<infer U | null> ? U : never;
export type TarEntry = ExtractTarEntry<ReturnType<Untar["extract"]>>;

export async function* untar(tar: Uint8Array): AsyncGenerator<TarEntry> {
  const untar = new Untar(new Deno.Buffer(tar.buffer));
  for await (const entry of untar) yield entry;
}

export async function* untgz(tgz: Uint8Array): AsyncGenerator<TarEntry> {
  yield* untar(gunzip(tgz));
}

export async function* stripComponents(
  entries: AsyncIterable<TarEntry>,
  number: number,
): AsyncGenerator<TarEntry> {
  for await (const entry of entries) {
    const fileName = stripComponent(entry.fileName, number);
    if (!fileName) continue;
    entry.fileName = fileName;
    yield entry;
  }
}

export async function pick(
  entries: AsyncIterable<TarEntry>,
  target: string,
): Promise<TarEntry | null> {
  for await (const entry of entries) {
    if (entry.type !== "file") continue;
    if (entry.fileName === target) return entry;
  }
  return null;
}
