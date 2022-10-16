import { compareRev, isSemver } from "../pollapo/rev.ts";
import { getVersionsDir } from "./config.ts";

export default function getLocalVersions(): string[] {
  try {
    const items = Array.from(Deno.readDirSync(getVersionsDir()));
    return items.filter(
      ({ name, isDirectory }) => isDirectory && isSemver(name),
    ).map((item) => item.name).sort(compareRev).reverse();
  } catch {
    return [];
  }
}
