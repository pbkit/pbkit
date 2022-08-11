import { fetchLatestRelease } from "../../misc/github/index.ts";

export default async function (version: string) {
  if (version !== "latest") return version;
  const res = await fetchLatestRelease({ user: "pbkit", repo: "pbkit" });
  return res.name;
}
