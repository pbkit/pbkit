import * as path from "https://deno.land/std@0.93.0/path/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.93.0/encoding/yaml.ts";
import { getHomeDir } from "../config.ts";

export interface GhHosts {
  [hostname: string]: GhHost;
}

export interface GhHost {
  user: string;
  oauth_token: string;
  git_protocol: "ssh" | "https";
}

export function getDefaultGhConfigPath(configFile = ".") {
  const ghConfigPath = path.resolve(getHomeDir(), ".config/gh", configFile);
  return ghConfigPath;
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
  throw new PollapoNotLoggedInError();
}

export interface GhRev {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
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

export interface GhRepoParams {
  token: string;
  user: string;
  repo: string;
}

export async function getIsRepoExists(
  { token, user, repo }: GhRepoParams,
): Promise<boolean> {
  const res = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    if ([404, 403].includes(res.status)) {
      return false;
    } else {
      throw res;
    }
  }

  return true;
}

export interface GetRepoRevGroupResponse {
  tags: GhTag[];
  branches: GhBranch[];
}
export async function getRepoRevGroup(
  { token, user, repo }: GhRepoParams,
): Promise<GetRepoRevGroupResponse> {
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };
  const [tagsRes, branchesRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${user}/${repo}/tags`, { headers }),
    fetch(`https://api.github.com/repos/${user}/${repo}/branches`, { headers }),
  ]);

  if (!tagsRes.ok) throw tagsRes;
  if (!branchesRes.ok) throw branchesRes;

  return {
    tags: await tagsRes.json(),
    branches: await branchesRes.json(),
  };
}

export interface FetchArchiveConfig {
  type: "tgz" | "zip";
  token: string;
  user: string;
  repo: string;
  rev: string;
}
export async function fetchArchive(
  config: FetchArchiveConfig,
): Promise<Response> {
  const { type, token, user, repo, rev } = config;
  const archiveType = type === "tgz" ? "tarball" : "zipball";
  const res = await fetch(
    `https://api.github.com/repos/${user}/${repo}/${archiveType}/${rev}`,
    {
      headers: {
        Authorization: "token " + token,
        Accept: "application/vnd.github.v3.raw",
      },
    },
  );
  if (!res.ok) throw res;
  return res;
}

export class PollapoNotLoggedInError extends Error {
  constructor() {
    super("Login required. Run `pollapo login` first.");
  }
}
