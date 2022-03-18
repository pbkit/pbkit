import { Loader, LoadResult } from "./index.ts";

export default function memoizeLoader(l: Loader): Loader {
  const memo: { [key: string]: LoadResult | null } = {};
  return {
    async load(path) {
      return memo[path] = await l.load(path);
    },
  };
}
