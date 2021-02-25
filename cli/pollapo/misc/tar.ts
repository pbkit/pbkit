import { TarMeta, Untar } from "https://deno.land/std@0.88.0/archive/tar.ts";
import { gunzip } from "https://deno.land/x/denoflate@1.1/mod.ts";

export async function* untar(tar: Uint8Array): AsyncGenerator<TarMeta> {
  const untar = new Untar(new Deno.Buffer(tar.buffer));
  for await (const entry of untar) yield entry;
}

export async function* untgz(tgz: Uint8Array): AsyncGenerator<TarMeta> {
  yield* untar(gunzip(tgz));
}
