import { Loader, LoadResult } from "./index.ts";

export interface MemoizedLoader extends Loader {
  update(loadResult: LoadResult): void;
}
export default function memoizeLoader(l: Loader): MemoizedLoader {
  const memo: { [key: string]: LoadResult | null } = {};
  return {
    async load(path) {
      if (memo[path]) return memo[path];
      return memo[path] = await l.load(path);
    },
    update(loadResult) {
      for (const path in memo) {
        const item = memo[path];
        if (!item || item.absolutePath !== loadResult.absolutePath) continue;
        item.data = loadResult.data;
      }
    },
  };
}
