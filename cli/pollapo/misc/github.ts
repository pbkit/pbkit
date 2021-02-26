import * as path from "https://deno.land/std@0.88.0/path/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.88.0/encoding/yaml.ts";

export interface GhHosts {
  [hostname: string]: GhHost;
}

export interface GhHost {
  user: string;
  oauth_token: string;
  git_protocol: "ssh" | "https";
}

export function getDefaultGhConfigPath(configFile = ".") {
  const home = Deno.env.get("HOME") ?? ".";
  const ghConfigPath = path.resolve(home, ".config/gh", configFile);
  return ghConfigPath;
}

export async function readGhHosts(
  hostsFilePath = getDefaultGhConfigPath("hosts.yml"),
): Promise<GhHosts> {
  const hostsFile = await Deno.readTextFile(hostsFilePath);
  return parseYaml(hostsFile) as GhHosts;
}

export interface FetchTarballConfig {
  token: string;
  user: string;
  repo: string;
  rev: string;
}
export async function fetchTarball(
  config: FetchTarballConfig,
): Promise<Response> {
  const { token, user, repo, rev } = config;
  const res = await fetch(
    `https://api.github.com/repos/${user}/${repo}/tarball/${rev}`,
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
