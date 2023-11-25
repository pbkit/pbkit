import { parse as parseYaml } from "https://deno.land/std@0.175.0/encoding/yaml.ts";

export interface BufModule {
  version: string;
  build: {}
}

export interface BufModuleV1Beta1 extends BufModule {
  version: "v1beta1";
  build: {
    roots: []
  }
}

export interface BufModuleV1 extends BufModule {
  version: "v1";
}

export function parseBufModuleYaml(text: string): BufModuleV1 | BufModuleV1Beta1 {
  const yaml = parseYaml(text) as any;
  const result = { version: String(yaml.version || "v1"), build: {} } as BufModuleV1 | BufModuleV1Beta1;
  if (result.version === "v1beta1") {
    result.build.roots = yaml.build && Array.isArray(yaml.build.roots) ? yaml.build.roots : [];
  }
  return result;
}
