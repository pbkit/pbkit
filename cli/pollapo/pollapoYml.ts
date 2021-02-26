import { parse as parseYaml } from "https://deno.land/std@0.84.0/encoding/yaml.ts";
import { ensureDir, exists } from "https://deno.land/std@0.88.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import { pick, stripComponents, untgz } from "./misc/tar.ts";

export type PollapoYml = {
  deps?: string[];
} | undefined;

export interface PollapoDep {
  user: string;
  repo: string;
  rev: string;
}

export interface GetPollapoYmlConfig {
  dep: PollapoDep;
  cacheDir: string;
}
export async function getPollapoYml(
  config?: GetPollapoYmlConfig,
): Promise<PollapoYml | null> {
  try {
    const ymlPath = config
      ? getYmlPath(config.cacheDir, config.dep)
      : "pollapo.yml";
    const pollapoYmlText = await Deno.readTextFile(ymlPath);
    return parseYaml(pollapoYmlText) as PollapoYml;
  } catch {
    return null;
  }
}

export function* deps(pollapoYml: PollapoYml) {
  for (const dep of pollapoYml?.deps ?? []) yield parseDep(dep);
}

export function parseDep(dep: string): PollapoDep {
  const match = /(?<user>.+?)\/(?<repo>.+?)@(?<rev>.+)/.exec(dep);
  if (!match) throw new Error("invalid dep string: " + dep);
  return match.groups as unknown as PollapoDep;
}

export function getTgzPath(cacheDir: string, dep: PollapoDep): string {
  return path.resolve(cacheDir, dep.user, dep.repo + "@" + dep.rev + ".tgz");
}

export function getYmlPath(cacheDir: string, dep: PollapoDep): string {
  return path.resolve(cacheDir, dep.user, dep.repo + "@" + dep.rev + ".yml");
}

export interface CacheDepsConfig {
  pollapoYml: PollapoYml;
  cacheDir: string;
  fetchTarball: (dep: PollapoDep) => Promise<Uint8Array>;
}
export async function cacheDeps(config: CacheDepsConfig) {
  const { pollapoYml, cacheDir, fetchTarball } = config;
  const queue = [...deps(pollapoYml)];
  let dep;
  while (dep = queue.shift()) {
    const tgzPath = getTgzPath(cacheDir, dep);
    const ymlPath = getYmlPath(cacheDir, dep);
    if (await exists(ymlPath)) continue;
    const tgz = await fetchTarball(dep);
    const pollapoYmlText = await extractPollapoYml(tgz);
    const pollapoYml = parseYaml(pollapoYmlText) as PollapoYml;
    queue.push(...deps(pollapoYml));
    await ensureDir(path.resolve(cacheDir, dep.user));
    await Deno.writeFile(tgzPath, tgz);
    await Deno.writeTextFile(ymlPath, pollapoYmlText);
  }
}

async function extractPollapoYml(tgz: Uint8Array): Promise<string> {
  const pollapoYmlEntry = await pick(
    stripComponents(untgz(tgz), 1),
    "pollapo.yml",
  );
  if (!pollapoYmlEntry) return "";
  const pollapoYml = await Deno.readAll(pollapoYmlEntry);
  const decoder = new TextDecoder();
  return decoder.decode(pollapoYml);
}
