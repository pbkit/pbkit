import { Loader } from "./index.ts";

export default function combineLoader(a: Loader, b: Loader): Loader {
  return {
    async load(path) {
      return (
        (await a.load(path)) ||
        (await b.load(path))
      );
    },
  };
}
