import * as semver from "https://deno.land/x/semver@v1.0.0/mod.ts";

export function isSemver(rev: string): boolean {
  return semver.clean(rev) != null;
}

export function compareRev(a: string, b: string): -1 | 0 | 1 {
  const aa = semver.clean(a);
  const bb = semver.clean(b);
  if (aa != null && bb == null) return -1;
  if (aa == null && bb != null) return 1;
  if (aa != null && bb != null) {
    if (semver.lt(aa, bb)) return -1;
    if (semver.gt(aa, bb)) return 1;
  }
  return a == b ? 0 : a < b ? -1 : 1;
}
