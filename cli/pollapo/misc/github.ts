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
