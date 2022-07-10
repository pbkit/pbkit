import { stringify } from "https://deno.land/std@0.147.0/encoding/yaml.ts";
import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.147.0/fs/mod.ts";
import { wait as spinner } from "https://deno.land/x/wait@0.1.12/mod.ts";
import wait from "../../core/runtime/async/wait.ts";
import { getDefaultGhConfigPath } from "./index.ts";

// https://github.com/cli/cli/blob/trunk/internal/authflow/flow.go#L18-L23
const oauthClientId = "178c6fc778ccc68e1d6a";
const oauthClientSecret = "34ddeff2b558a23d38fba8a6de74f086ede1cc0b";
const scopes = ["repo", "read:org", "gist"];
const grantType = "urn:ietf:params:oauth:grant-type:device_code";

function getDeviceInitUrl(host: string) {
  return `https://${host}/login/device/code`;
}
function getTokenUrl(host: string) {
  return `https://${host}/login/oauth/access_token`;
}

export interface RequestCodeResult {
  deviceCode: string;
  expiresIn: number;
  interval: number;
  userCode: string;
  verificationUri: string;
}
export async function requestCode(): Promise<RequestCodeResult> {
  const res = await fetch(getDeviceInitUrl("github.com"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: oauthClientId,
      scope: scopes.join(" "),
    }),
  });
  const resText = await res.text();
  const parsedRes = new URLSearchParams(resText);
  return {
    deviceCode: parsedRes.get("device_code") ?? "",
    expiresIn: Number(parsedRes.get("expires_in")),
    interval: Number(parsedRes.get("interval")),
    userCode: parsedRes.get("user_code") ?? "",
    verificationUri: parsedRes.get("verification_uri") ?? "",
  };
}

export async function validateToken(token: string): Promise<void> {
  const res = await fetch("https://api.github.com/", {
    headers: {
      Authorization: `token ${token}`,
    },
  });
  if (!res.ok) {
    if (res.status === 401) throw new PollapoUnauthorizedError();
    throw new Error(
      `Unexpected HTTP request failure with response ${res.status}`,
    );
  }
}

export class PollapoUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized Github API token.");
  }
}

interface PollTokenResponse {
  accessToken: string;
  tokenType: string;
  scope: string;
}
export async function pollToken(
  code: RequestCodeResult,
): Promise<PollTokenResponse> {
  const { interval } = code;
  const startDate = new Date();
  const expireDate = new Date(startDate);
  expireDate.setSeconds(
    startDate.getSeconds() + code.expiresIn,
  );
  const loading = spinner("Wait for authorization complete...").start();
  while (true) {
    await wait(interval * 1000);
    try {
      const res = await fetch(getTokenUrl("github.com"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: oauthClientId,
          device_code: code.deviceCode,
          grant_type: grantType,
        }),
      });
      const resText = await res.text();
      const parsedRes = new URLSearchParams(resText);
      const resError = parsedRes.get("error");
      if (resError) {
        throw new Error(resError);
      }
      loading.stop();
      return {
        accessToken: parsedRes.get("access_token") ?? "",
        tokenType: parsedRes.get("token_type") ?? "",
        scope: parsedRes.get("scope") ?? "",
      };
    } catch (err) {
      if (err.message !== "authorization_pending") {
        loading.stop();
        throw err;
      }
    }
  }
}

export async function writeGhHosts(
  token: string,
  hostsFilePath = getDefaultGhConfigPath("hosts.yml"),
) {
  const hostsData = {
    "github.com": {
      "oauth_token": token,
      "git_protocol": "ssh",
    },
  };
  await ensureDir(path.dirname(hostsFilePath));
  await Deno.writeTextFile(hostsFilePath, stringify(hostsData));
}
