import { parse as parseYaml } from "https://deno.land/std@0.175.0/encoding/yaml.ts";

export interface BufYaml {
  version: string | "v1" | "v1beta1" | "v2";
  build?: {
    /**
     * @deprecated
     */
    roots?: string[];
  };
  modules?: {
    path: string;
    includes?: string[];
    excludes?: string[];
  }[];
}

export function parseBufYaml(
  text: string,
): BufYaml {
  const yaml = parseYaml(text) as any;
  yaml.version ??= "v2";
  return yaml;
}
