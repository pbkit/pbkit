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
): Promise<PollapoYml> {
  const ymlPath = config
    ? getYmlPath(config.cacheDir, config.dep)
    : "pollapo.yml";
  try {
    const pollapoYmlText = await Deno.readTextFile(ymlPath);
    return parseYaml(pollapoYmlText) as PollapoYml;
  } catch {
    throw new PollapoYmlNotFoundError(ymlPath);
  }
}
export class PollapoYmlNotFoundError extends Error {
  constructor(public ymlPath: string) {
    super(`"${path.resolve(ymlPath)}" not found.`);
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

export function depToString(dep: PollapoDep): string {
  return `${dep.user}/${dep.repo}@${dep.rev}`;
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
  let dep: PollapoDep;
  while (dep = queue.shift()!) {
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

export interface AnalyzeDepsConfig {
  pollapoYml: PollapoYml;
  cacheDir: string;
}
export interface AnalyzeDepsResult {
  [repo: string]: AnalyzeDepsResultRevs;
}
export interface AnalyzeDepsResultRevs {
  [rev: string]: AnalyzeDepsResultRev;
}
export interface AnalyzeDepsResultRev {
  froms: string[];
}
export async function analyzeDeps(
  config: AnalyzeDepsConfig,
): Promise<AnalyzeDepsResult> {
  type Dep = PollapoDep & { from: string };
  const result: AnalyzeDepsResult = {};
  const { pollapoYml, cacheDir } = config;
  const queue: Dep[] = [...deps(pollapoYml)].map((dep) => ({
    ...dep,
    from: "<root>",
  }));
  let dep: Dep;
  while (dep = queue.shift()!) {
    const repo = `${dep.user}/${dep.repo}`;
    const froms = result[repo]?.[dep.rev].froms ?? [];
    const revs: AnalyzeDepsResultRevs = result[repo] ?? {};
    froms.push(dep.from);
    revs[dep.rev] = { froms };
    result[repo] = revs;
    const pollapoYml = await getPollapoYml({ dep, cacheDir });
    for (const innerDep of deps(pollapoYml)) {
      if (depToString(dep) === depToString(innerDep)) continue;
      queue.push({ ...innerDep, from: depToString(dep) });
    }
  }
  return result;
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
