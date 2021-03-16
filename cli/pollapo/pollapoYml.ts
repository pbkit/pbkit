import { parse as parseYaml } from "https://deno.land/std@0.84.0/encoding/yaml.ts";
import {
  emptyDir,
  ensureDir,
  exists,
} from "https://deno.land/std@0.88.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import { stripComponents, unzip } from "./misc/archive/zip.ts";
import { isSemver } from "./rev.ts";

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

export function getZipPath(cacheDir: string, dep: PollapoDep): string {
  return path.resolve(cacheDir, dep.user, dep.repo + "@" + dep.rev + ".zip");
}

export function getYmlPath(cacheDir: string, dep: PollapoDep): string {
  return path.resolve(cacheDir, dep.user, dep.repo + "@" + dep.rev + ".yml");
}

export interface CacheDepsConfig {
  pollapoYml: PollapoYml;
  clean: boolean;
  cacheDir: string;
  fetchZip: (dep: PollapoDep) => Promise<Uint8Array>;
}
export interface CacheDepsCurrentItem {
  dep: PollapoDep;
  downloading: Promise<void>;
}
export async function* cacheDeps(
  config: CacheDepsConfig,
): AsyncGenerator<CacheDepsCurrentItem> {
  const { pollapoYml, clean, cacheDir, fetchZip } = config;
  if (clean) await emptyDir(cacheDir);
  const queue = [...deps(pollapoYml)];
  let dep: PollapoDep;
  const cachedDeps: { [cachedDep: string]: true } = {};
  while (dep = queue.shift()!) {
    const zipPath = getZipPath(cacheDir, dep);
    const ymlPath = getYmlPath(cacheDir, dep);
    if (cachedDeps[depToString(dep)]) continue;
    if (isSemver(dep.rev) && await exists(ymlPath)) continue;
    const downloading = new Promise<void>(async (resolve, reject) => {
      try {
        const zip = await fetchZip(dep);
        const pollapoYmlText = await extractPollapoYml(zip);
        const pollapoYml = parseYaml(pollapoYmlText) as PollapoYml;
        queue.push(...deps(pollapoYml));
        cachedDeps[depToString(dep)] = true;
        await ensureDir(path.resolve(cacheDir, dep.user));
        await Deno.writeFile(zipPath, zip);
        await Deno.writeTextFile(ymlPath, pollapoYmlText);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    yield { dep, downloading };
    await downloading;
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
    const froms = result[repo]?.[dep.rev]?.froms ?? [];
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

async function extractPollapoYml(zip: Uint8Array): Promise<string> {
  const files = stripComponents(await unzip(zip), 1);
  return files["pollapo.yml"].async("text");
}
