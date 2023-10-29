import { compareRev } from "../pollapo/rev.ts";
import { getVersionsDir } from "./config.ts";

export default function getLocalVersions(): string[] {
  try {
    const items = Array.from(Deno.readDirSync(getVersionsDir()));
    return items.filter(
      ({ isDirectory }) => isDirectory,
    ).map((item) => item.name).sort(compareRev).reverse();
  } catch {
    return [];
  }
}
