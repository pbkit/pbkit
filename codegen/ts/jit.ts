import { dirname, join } from "../path.ts";
import { Export, Module, Ref } from "./code-fragment.ts";
import evalContext from "./evalContext.ts";
import runtimeTable from "./generated/runtime-table.ts";

export interface JitConfig {
  modules: Iterable<Module>;
  /** for custom type mapping */
  builtins?: { [filePath: string]: object };
}
export interface JitResult {
  import(filePath: string): Promise<{ [key: string]: any }>;
  /** debugging purpose */
  _internal: { [filePath: string]: CompileResult };
}
export default async function jit(config: JitConfig): Promise<JitResult> {
  const prelude: { [filePath: string]: object } = {
    ...runtimeTable,
    ...config.builtins,
  };
  const modules: { [filePath: string]: Module } = {};
  const compiledModules: { [filePath: string]: CompileResult } = {};
  for (const module of config.modules) modules[module.filePath] = module;
  return {
    import: importAbsolute,
    _internal: compiledModules,
  };
  async function importAbsolute(filePath: string): Promise<any> {
    if (filePath in prelude) return prelude[filePath];
    if (filePath in compiledModules) return compiledModules[filePath].module;
    const module = modules[filePath];
    if (!module) throw new Error(`Module not found: ${filePath}`);
    const moduleObject: ModuleObject = { exports: {} };
    compiledModules[filePath] = compile({
      moduleObject,
      module: modules[filePath],
      import: (target) => {
        if (target.startsWith(".")) return importRelative(filePath, target);
        else return importAbsolute(target);
      },
    });
    return await compiledModules[filePath].run();
  }
  async function importRelative(from: string, filePath: string): Promise<any> {
    return await importAbsolute(join(dirname(from), filePath));
  }
}

export class JitError extends Error {
  constructor(public err: any) {
    super();
  }
}

export interface CompileResult {
  code: string;
  module: ModuleObject;
  run: () => Promise<ModuleObject>;
}
export interface ModuleObject {
  exports: object;
}

interface CompileConfig {
  moduleObject: { exports: object };
  module: Module;
  import(filePath: string): Promise<any>;
}
function compile(config: CompileConfig): CompileResult {
  const { module } = config;
  const { importBuffer } = module;
  const froms = Array.from(importBuffer.froms());
  const deps = Object.fromEntries(froms.map(
    ({ from }, index) => [from, `__module${index}`],
  ));
  function renderRef(ref: Ref): string {
    const { from, item } = importBuffer.getImportFromRef(ref)!;
    if (item === "*") return deps[from];
    return `${deps[from]}.${item}`;
  }
  const body = Array.from(module).map((fragment) => {
    if (fragment instanceof Export) {
      if (fragment.codeFragment.type === "ts") return;
      return `${
        fragment.codeFragment.toString("js", renderRef)
      };\nexports.${fragment.name} = ${fragment.name};\n`;
    }
    const code = fragment.toString("js", renderRef);
    if (code) return code + "\n";
  }).filter((x) => x).join("\n");
  const code = [
    `(async function (module, ${Object.values(deps).join(", ")}) {`,
    `"use strict";`,
    `const exports = module.exports;\n`,
    body,
    `return module.exports;`,
    `})`,
  ].join("\n");
  const specifier = `pbkit://${config.module.filePath}`;
  const [moduleFn, err] = evalContext(code, specifier);
  if (err != null) throw new JitError(err);
  return {
    code,
    module: config.moduleObject,
    async run() {
      const args = await Promise.all(Object.keys(deps).map(config.import));
      return await moduleFn(config.moduleObject, ...args);
    },
  };
}
