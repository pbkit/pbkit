import { parse as parseYaml } from "https://deno.land/std@0.175.0/encoding/yaml.ts";
import {
  emptyDir,
  ensureDir,
  exists,
} from "https://deno.land/std@0.175.0/fs/mod.ts";
import { red, yellow } from "https://deno.land/std@0.175.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.175.0/path/mod.ts";
import { stripComponents, unzip } from "../../misc/archive/zip.ts";
import { fetchArchive, fetchCommitStatus } from "../../misc/github/index.ts";
import which from "../../misc/which.ts";
import backoff from "./misc/exponential-backoff.ts";
import { getRevType } from "./rev.ts";
import { YAMLError } from "https://deno.land/std@0.175.0/encoding/_yaml/error.ts";

export type PollapoYml = {
  repo?: string;
  deps?: string[];
  root?: PollapoRoot;
} | undefined;

export interface PollapoDep {
  user: string;
  repo: string;
  rev: string;
}

export type PollapoDepFrag =
  & Omit<PollapoDep, "rev">
  & Partial<Pick<PollapoDep, "rev">>;

export interface PollapoRoot {
  lock?: PollapoRootLockTable;
}

export interface PollapoRootLockTable {
  [dep: string]: string; // value: commit hash
}

export interface PollapoRootReplaceFileOption {
  [optionName: string]: PollapoRootReplaceFileOptionItem;
}

export interface PollapoRootReplaceFileOptionItem {
  regex: string;
  value: string;
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
  return loadPollapoYml(ymlPath);
}
export async function loadPollapoYml(ymlPath: string): Promise<PollapoYml> {
  try {
    const pollapoYmlText = await Deno.readTextFile(ymlPath);
    return parseYaml(pollapoYmlText) as PollapoYml;
  } catch (err) {
    if (err instanceof YAMLError) throw new PollapoYmlMalformedError(ymlPath);
    else throw new PollapoYmlNotFoundError(ymlPath);
  }
}
export class PollapoYmlNotFoundError extends Error {
  constructor(public ymlPath: string) {
    super(`"${red(path.resolve(ymlPath))}" not found.`);
  }
}

export class PollapoYmlMalformedError extends Error {
  constructor(public ymlPath: string) {
    super(`"${yellow(path.resolve(ymlPath))}" is malformed`);
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

export function parseDepFrag(dep: string): PollapoDepFrag {
  const match = /(?<user>.+?)\/(?<repo>.+?)(@(?<rev>.+))?$/.exec(dep);
  if (!match) throw new Error("invalid dep string: " + dep);
  return match.groups as unknown as PollapoDepFrag;
}

export function depToString(dep: PollapoDep): string {
  return `${dep.user}/${dep.repo}@${dep.rev}`;
}

export function getZipPath(cacheDir: string, dep: PollapoDep): string {
  return getCachePath(cacheDir, dep) + ".zip";
}

export function getYmlPath(cacheDir: string, dep: PollapoDep): string {
  return getCachePath(cacheDir, dep) + ".yml";
}

function getCachePath(cacheDir: string, dep: PollapoDep): string {
  return path.resolve(
    cacheDir,
    encode(dep.user),
    encode(dep.repo) + "@" + encode(dep.rev),
  );
}

// https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
function encode(rev: string): string {
  return rev.replaceAll(
    /[%\\/:*"<>|]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export type FetchCommitHashFn = (dep: PollapoDep) => Promise<string>;

export type DownloadZipAndYmlFn = (
  dep: PollapoDep,
  zipPath: string,
  ymlPath: string,
) => Promise<PollapoYml>;

export interface CacheDepsConfig {
  pollapoYml: PollapoYml;
  clean: boolean;
  cacheDir: string;
  fetchCommitHash: FetchCommitHashFn;
  downloadZipAndYml: DownloadZipAndYmlFn;
}
export type CacheDepsTask =
  | CacheDepsTaskUseCache
  | CacheDepsTaskUseLockedCommitHash
  | CacheDepsTaskCheckCommitHash
  | CacheDepsTaskDownload;
interface CacheDepsTaskBase<TTaskType extends string, TResult> {
  type: TTaskType;
  dep: PollapoDep;
  promise: Promise<TResult>;
}
export type CacheDepsTaskUseCache = CacheDepsTaskBase<"use-cache", void>;
export type CacheDepsTaskUseLockedCommitHash = CacheDepsTaskBase<
  "use-locked-commit-hash",
  string
>;
export type CacheDepsTaskCheckCommitHash = CacheDepsTaskBase<
  "check-commit-hash",
  string
>;
export type CacheDepsTaskDownload = CacheDepsTaskBase<
  "download",
  PollapoYml
>;
export async function* cacheDeps(
  config: CacheDepsConfig,
): AsyncGenerator<CacheDepsTask> {
  const { pollapoYml, clean, cacheDir, downloadZipAndYml, fetchCommitHash } =
    config;
  if (clean) await emptyDir(cacheDir);
  const lockTable = pollapoYml?.root?.lock ?? {};
  const queue = [...deps(pollapoYml)];
  let dep: PollapoDep;
  const visitedDeps: { [visitedDep: string]: true } = {};
  while (dep = queue.shift()!) {
    const ymlPath = getYmlPath(cacheDir, dep);
    const revType = getRevType(dep.rev);
    const depString = depToString(dep);
    if (visitedDeps[depString]) continue;
    visitedDeps[depString] = true;
    if ((revType !== "branch") && await exists(ymlPath)) {
      yield { type: "use-cache", dep, promise: Promise.resolve() };
      const pollapoYmlText = await Deno.readTextFile(ymlPath);
      const pollapoYml = parseYaml(pollapoYmlText) as PollapoYml;
      queue.push(...deps(pollapoYml));
      continue;
    }
    await ensureDir(path.resolve(cacheDir, dep.user));
    if (revType === "branch") {
      const fetchingCommitHash = depString in lockTable
        ? Promise.resolve(lockTable[depString])
        : fetchCommitHash(dep);
      const taskType = depString in lockTable
        ? "use-locked-commit-hash"
        : "check-commit-hash";
      yield { type: taskType, dep, promise: fetchingCommitHash };
      const commitHash = await fetchingCommitHash;
      queue.push({ ...dep, rev: commitHash });
      await unlink(dep);
      try {
        await link(dep, commitHash);
      } catch (err) {
        if (Deno.build.os === "windows") {
          // https://docs.microsoft.com/en-us/windows/win32/debug/system-error-codes--1300-1699-
          if (err?.message?.includes("(os error 1314)")) {
            throw new PollapoWindowsPrivilegeNotHeldError();
          }
        }
        throw err;
      }
    } else {
      const zipPath = getZipPath(cacheDir, dep);
      const ymlPath = getYmlPath(cacheDir, dep);
      const downloading = downloadZipAndYml(dep, zipPath, ymlPath);
      yield { type: "download", dep, promise: downloading };
      const pollapoYml = await downloading;
      queue.push(...deps(pollapoYml));
    }
  }
  async function unlink(dep: PollapoDep) {
    try {
      await Promise.all([
        Deno.remove(getZipPath(cacheDir, dep)),
        Deno.remove(getYmlPath(cacheDir, dep)),
      ]);
    } catch {
      // Ignore if file does not exist
    }
  }
  async function link(dep: PollapoDep, rev: string) {
    const targetDep: PollapoDep = { ...dep, rev };
    await Promise.all([
      Deno.symlink(
        getZipPath(cacheDir, targetDep),
        getZipPath(cacheDir, dep),
        { type: "file" },
      ),
      Deno.symlink(
        getYmlPath(cacheDir, targetDep),
        getYmlPath(cacheDir, dep),
        { type: "file" },
      ),
    ]);
  }
}

export class PollapoWindowsPrivilegeNotHeldError extends Error {
  constructor() {
    super(
      "A required privilege is not held by the client. Please run the command as administrator.",
    );
  }
}

export function lock<T extends (PollapoDep | undefined) = PollapoDep>(
  lockTable: PollapoRootLockTable,
  dep: T,
): T {
  if (!dep) return dep;
  const depString = depToString(dep!);
  if (depString in lockTable) return { ...dep!, rev: lockTable[depString] };
  return dep;
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
  const lockTable = pollapoYml?.root?.lock ?? {};
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
    const pollapoYml = await getPollapoYml({
      dep: lock(lockTable, dep),
      cacheDir,
    });
    for (const innerDep of deps(pollapoYml)) {
      if (depToString(dep) === depToString(innerDep)) continue;
      queue.push({ ...innerDep, from: depToString(dep) });
    }
  }
  return result;
}

export function sanitizeDeps(pollapoYml: PollapoYml): PollapoYml {
  const deps = pollapoYml?.deps ?? [];
  const result: PollapoYml = { ...pollapoYml };
  if (deps.length === 0) {
    delete result.deps;
  } else {
    result.deps = [...new Set(result.deps)].sort();
  }
  if (result.root?.lock) {
    result.root.lock = sortObjectKeys(result.root.lock);
    if (!Object.keys(result.root.lock).length) delete result.root.lock;
  }
  if (result.root && !Object.keys(result.root).length) delete result.root;
  return result;
}

function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) result[key] = obj[key];
  return result;
}

export const fetchCommitHashWithGit = async (
  { user, repo, rev }: PollapoDep,
): Promise<string> => {
  const git = await which("git");
  if (!git) throw new Error("git not found");
  const repoUrl = `git@github.com:${user}/${repo}.git`;
  const match = new TextDecoder().decode(
    await Deno.run({
      cmd: [git, "ls-remote", "--heads", "--tags", repoUrl],
      stdout: "piped",
    }).output(),
  ).trim().match(
    new RegExp(`^([0-9a-f]{40})\\s+refs/(?:heads|tags)/${rev}$`, "m"),
  );
  if (match) return match[1];
  throw new Error(
    `Could not find commit hash for ref '${rev}' in the repository '${repoUrl}'`,
  );
};

export function getFetchCommitHash(token?: string) {
  return async function fetchCommitHash(dep: PollapoDep): Promise<string> {
    const res = await backoff(() => fetchCommitStatus({ token, ...dep }));
    return res.sha;
  };
}

export const downloadZipAndYmlWithGit: DownloadZipAndYmlFn = async (
  { user, repo, rev },
  zipPath,
  ymlPath,
) => {
  const git = await which("git");
  if (!git) throw new Error("git not found");
  const repoUrl = `git@github.com:${user}/${repo}.git`;
  const cwd = await Deno.makeTempDir();
  await Deno.run({ cwd, cmd: [git, "init"] }).status();
  await Deno.run({ cwd, cmd: [git, "remote", "add", "origin", repoUrl] })
    .status();
  await Deno.run({ cwd, cmd: [git, "fetch", "origin", rev, "--depth=1"] })
    .status();
  await Deno.run({
    cwd,
    cmd: [
      git,
      "archive",
      "--format=zip",
      rev,
      "--prefix",
      `${user}-${repo}-${rev.replaceAll("/", "-")}/`,
      "-o",
      zipPath,
    ],
  })
    .status();
  await Deno.run({ cwd, cmd: [git, "checkout", rev, "--", "pollapo.yml"] })
    .status();
  try {
    const pollapoYmlText = await Deno.readTextFile(
      path.resolve(cwd, "pollapo.yml"),
    );
    await Deno.writeTextFile(ymlPath, pollapoYmlText);
    const pollapoYml = parseYaml(pollapoYmlText) as PollapoYml;
    return pollapoYml;
  } catch {
    await Deno.writeTextFile(ymlPath, "");
    return {};
  }
};

export function getDownloadZipAndYmlFnByToken(
  token?: string,
): DownloadZipAndYmlFn {
  return async function downloadZipAndYml(dep, zipPath, ymlPath) {
    const res = await backoff(() =>
      fetchArchive({ type: "zip", token, ...dep })
    );
    const zip = new Uint8Array(await res.arrayBuffer());
    const pollapoYmlText = await extractPollapoYml(zip);
    const pollapoYml = parseYaml(pollapoYmlText) as PollapoYml;
    await Promise.all([
      Deno.writeFile(zipPath, zip),
      Deno.writeTextFile(ymlPath, pollapoYmlText),
    ]);
    return pollapoYml;
  };
}

async function extractPollapoYml(zip: Uint8Array): Promise<string> {
  const files = stripComponents(await unzip(zip), 1);
  const pollapoYml = files["pollapo.yml"];
  if (!pollapoYml) return "";
  return pollapoYml.async("text");
}
