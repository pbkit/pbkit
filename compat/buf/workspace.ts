import { parse as parseYaml } from "https://deno.land/std@0.147.0/encoding/yaml.ts";

export interface BufWorkYaml {
  version: "v1";
  directories: string[];
}

export function parseBufWorkYaml(text: string): BufWorkYaml {
  const yaml = parseYaml(text) as any;
  const result = { version: String(yaml.version || "v1") } as BufWorkYaml;
  result.directories = Array.isArray(yaml.directories) ? yaml.directories : [];
  return result;
}
