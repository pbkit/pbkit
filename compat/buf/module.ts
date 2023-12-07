import { parse as parseYaml } from "https://deno.land/std@0.175.0/encoding/yaml.ts";

export interface BufYaml {
  version: string | "v1" | "v1beta1";
  build: {
    /**
     * @deprecated
     */
    roots: string[];
  };
}

export function parseBufYaml(
  text: string,
): BufYaml {
  const yaml = parseYaml(text) as any;
  const result = {
    version: String(yaml.version || "v1"),
    build: {},
  } as BufYaml;
  result.build.roots = Array.isArray(yaml.build?.roots) ? yaml.build.roots : [];
  return result;
}
