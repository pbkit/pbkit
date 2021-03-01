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
  const parsedRes = new URLSearchParams(await res.text());
  return {
    deviceCode: parsedRes.get("device_code") ?? "",
    expiresIn: Number(parsedRes.get("expires_in")),
    interval: Number(parsedRes.get("interval")),
    userCode: parsedRes.get("user_code") ?? "",
    verificationUri: parsedRes.get("verification_uri") ?? "",
  };
}

export async function pollToken() {
  getTokenUrl("github.com"); // TODO
}
