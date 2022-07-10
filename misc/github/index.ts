import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.147.0/encoding/yaml.ts";
import { red } from "https://deno.land/std@0.147.0/fmt/colors.ts";
import { getHomeDir } from "../env.ts";

export interface GhHosts {
  [hostname: string]: GhHost;
}

export interface GhHost {
  user: string;
  oauth_token: string;
  git_protocol: "ssh" | "https";
}

export function getDefaultGhConfigPath(configFile = ".") {
  // TODO: https://github.com/cli/cli/blob/58cb773/internal/config/config_file.go#L24-L28
  if (Deno.build.os === "windows" && Deno.env.get("AppData")) {
    return path.join(Deno.env.get("AppData")!, "GitHub CLI", configFile);
  } else {
    return path.resolve(getHomeDir(), ".config", "gh", configFile);
  }
}

export async function readGhHosts(
  hostsFilePath = getDefaultGhConfigPath("hosts.yml"),
): Promise<GhHosts> {
  const hostsFile = await Deno.readTextFile(hostsFilePath);
  return parseYaml(hostsFile) as GhHosts;
}

export async function getToken(): Promise<string> {
  try {
    const ghHosts = await readGhHosts();
    const token = ghHosts["github.com"].oauth_token;
    if (token) return token;
  } catch {}
  throw new GithubNotLoggedInError();
}

export interface GhCommit {
  sha: string;
  url: string;
}
export interface GhRev {
  name: string;
  commit: GhCommit;
}
export interface GhTag extends GhRev {
  zipball_url: string;
  tarball_url: string;
  node_id: string;
}
export interface GhBranch extends GhRev {
  protected: string;
  protection: {
    required_status_checks: {
      enforcement_level: string;
      contexts: string[];
    };
  };
  protected_url: string;
}
export interface GhRepo {
  name: string;
}

export interface FetchRepoConfig {
  token?: string;
  user: string;
  repo: string;
}
export async function fetchRepo(config: FetchRepoConfig): Promise<GhRepo> {
  const res = await fetchRepoBase(config, "");
  return await res.json() as GhRepo;
}

export interface FetchCommitStatusConfig extends FetchRepoConfig {
  rev: string;
}
export async function fetchCommitStatus(
  config: FetchCommitStatusConfig,
): Promise<GhCommit> {
  const { rev } = config;
  const res = await fetchRepoBase(config, `/commits/${rev}/status`);
  return await res.json() as GhCommit;
}

export interface FetchTagsConfig extends FetchRepoConfig {}
export async function fetchTags(config: FetchTagsConfig): Promise<GhTag[]> {
  const res = await fetchRepoBase(config, "/tags");
  return await res.json() as GhTag[];
}

export interface FetchBranchesConfig extends FetchRepoConfig {}
export async function fetchBranches(
  config: FetchBranchesConfig,
): Promise<GhBranch[]> {
  const res = await fetchRepoBase(config, "/branches");
  return await res.json() as GhBranch[];
}

export interface FetchArchiveConfig extends FetchRepoConfig {
  type: "tgz" | "zip";
  rev: string;
}
export async function fetchArchive(
  config: FetchArchiveConfig,
): Promise<Response> {
  const { type, rev } = config;
  const archiveType = type === "tgz" ? "tarball" : "zipball";
  return await fetchRepoBase(config, `/${archiveType}/${rev}`);
}

export class GithubNotLoggedInError extends Error {
  constructor() {
    super("Login required.");
  }
}

export class GithubRepoNotFoundError extends Error {
  constructor(user: string, repo: string) {
    super(`Repository ${red(`${user}/${repo}`)} is not found.`);
  }
}

async function fetchRepoBase(
  config: FetchRepoConfig,
  apiPath: string,
): Promise<Response> {
  const { token, user, repo } = config;
  const headers = getFetchHeaders(token);
  const res = await fetch(
    `https://api.github.com/repos/${user}/${repo}${apiPath}`,
    { headers },
  );
  if (!res.ok) {
    switch (res.status) {
      case 401:
        throw new GithubNotLoggedInError();
      case 403:
      case 404:
        throw new GithubRepoNotFoundError(user, repo);
      default:
        throw res;
    }
  }
  return res;
}

function getFetchHeaders(token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
  };
  if (token) headers.Authorization = "token " + token;
  return headers;
}
