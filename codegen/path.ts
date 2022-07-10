import {
  assertPath,
  isPosixPathSeparator,
  normalizeString,
} from "https://deno.land/std@0.147.0/path/_util.ts";

export const CHAR_FORWARD_SLASH = 47;

export function relative(from: string, to: string): string {
  assertPath(from);
  assertPath(to);
  from = normalize(from);
  to = normalize(to);
  if (from === to) return "";
  const fromFragments = from.split("/").filter(Boolean);
  const toFragments = to.split("/").filter(Boolean);
  while (fromFragments.length && toFragments.length) {
    if (fromFragments[0] !== toFragments[0]) break;
    fromFragments.shift();
    toFragments.shift();
  }
  return [...fromFragments.map(() => ".."), ...toFragments].join("/");
}

export function dirname(path: string): string {
  assertPath(path);
  if (path.length === 0) return ".";
  const hasRoot = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
  let end = -1;
  let matchedSlash = true;
  for (let i = path.length - 1; i >= 1; --i) {
    if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      matchedSlash = false;
    }
  }
  if (end === -1) return hasRoot ? "/" : ".";
  if (hasRoot && end === 1) return "//";
  return path.slice(0, end);
}

const protocolRegex = /^\w+:\/\//;
export function join(...paths: string[]): string {
  if (paths.length === 0) return ".";
  let joined: string | undefined;
  for (let i = 0, len = paths.length; i < len; ++i) {
    const path = paths[i];
    assertPath(path);
    if (path.length > 0) {
      if (!joined) joined = path;
      else joined += `/${path}`;
    }
  }
  if (!joined) return ".";
  if (protocolRegex.test(joined)) {
    let protocol: string;
    const normalized = normalize(
      joined.replace(protocolRegex, (p) => ((protocol = p), "")),
    );
    return protocol! + normalized;
  }
  return normalize(joined);
}

export function normalize(path: string): string {
  assertPath(path);
  if (path.length === 0) return ".";
  const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
  const trailingSeparator =
    path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;
  path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";
  if (isAbsolute) return `/${path}`;
  return path;
}
