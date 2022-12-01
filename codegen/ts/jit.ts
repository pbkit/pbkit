import { join } from "../path.ts";
import { Export, Module } from "./code-fragment.ts";
import evalContext from "./evalContext.ts";
import runtimeTable from "./generated/runtime-table.ts";

export interface JitConfig {
  modules: Generator<Module>;
}
export interface JitResult {
  import(filePath: string): Promise<any>;
  /** debugging purpose */
  _internal: { [filePath: string]: EvalModuleResult };
}
export default async function jit(config: JitConfig): Promise<JitResult> {
  const modules: { [filePath: string]: Module } = {};
  const evaluatedModules: { [filePath: string]: EvalModuleResult } = {};
  for (const module of config.modules) modules[module.filePath] = module;
  return {
    import: importAbsolute,
    _internal: evaluatedModules,
  };
  async function importAbsolute(filePath: string): Promise<any> {
    if (filePath.startsWith("@pbkit/runtime/")) {
      return (runtimeTable as any)[filePath];
    }
    if (filePath in evaluatedModules) return evaluatedModules[filePath].value;
    const module = modules[filePath];
    if (!module) return;
    evaluatedModules[filePath] = await evalModule({
      module: modules[filePath],
      import: (target) => importRelative(filePath, target),
    });
    return evaluatedModules[filePath].value;
  }
  async function importRelative(from: string, filePath: string): Promise<any> {
    return await importAbsolute(join(from, filePath));
  }
}

interface EvalModuleConfig {
  module: Module;
  import(filePath: string): Promise<any>;
}
interface EvalModuleResult {
  source: string;
  value: any;
}
async function evalModule(config: EvalModuleConfig): Promise<EvalModuleResult> {
  const { module } = config;
  const importTable = module.importBuffer.getTable();
  const everyImports = Array.from(Object.entries(importTable)).flatMap(
    ([from, items]) =>
      Array.from(Object.entries(items)).map(
        ([as, item]) => ({ from, item, as }),
      ),
  );
  const params = everyImports.map(({ as }) => as);
  const args = await Promise.all(everyImports.map(
    async ({ from, item }) => {
      const module = await config.import(from);
      if (item === "*") return module;
      return module[item];
    },
  ));
  const body = Array.from(module).map((fragment) => {
    if (fragment instanceof Export) {
      return `exports.${fragment.name} = ${
        fragment.codeFragment.toString("js")
      };\n`;
    }
    const code = fragment.toString("js");
    if (code) return code + "\n";
  }).join("\n");
  const source = [
    `(async function (${params.join(", ")}) {`,
    `"use strict";`,
    `const exports = {};`,
    body,
    `return exports;`,
    `})`,
  ].join("\n");
  const specifier = `pbkit://${config.module.filePath}`;
  const moduleFn = evalContext(source, specifier)[0] as (...args: any[]) => any;
  const value = await moduleFn.apply(null, args);
  return { source, value };
}
