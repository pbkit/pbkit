import { Loader } from "./index.ts";

type Falsy = "" | false | null | undefined;

export default function combineLoader(
  ...loaders: (Falsy | Loader)[]
): Loader {
  const _loaders = loaders.filter((l) => l) as Loader[];
  return {
    async load(path) {
      for (const loader of _loaders) {
        const loadResult = await loader.load(path);
        if (loadResult) return loadResult;
      }
      return null;
    },
  };
}
