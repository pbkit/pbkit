import {
  fetchLatestCommit,
  fetchLatestRelease,
} from "../../misc/github/index.ts";

export default async function resolveRev(version: string) {
  switch (version) {
    case "latest": {
      const res = await fetchLatestRelease({ user: "pbkit", repo: "pbkit" });
      return res.name;
    }
    case "nightly": {
      const res = await fetchLatestCommit({ user: "pbkit", repo: "pbkit" });
      return res.sha;
    }
    default: {
      return version;
    }
  }
}
