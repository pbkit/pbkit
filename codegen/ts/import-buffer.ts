import { dirname, join, relative } from "../path.ts";
import { GenRuntimeConfig } from "./aot.ts";

export interface AddImport {
  (from: string, item: string, as?: string): string;
}
export interface AddInternalImport {
  (here: string, from: string, item: string, as?: string): string;
}

export interface ImportBuffer {
  addInternalImport: AddInternalImport;
  addImport: AddImport;
  addRuntimeImport: AddInternalImport;
  getCode(): string;
}

export type CreateImportBufferFn = typeof createImportBuffer;

export interface CreateImportBufferConfig {
  reservedNames?: string[];
  runtime?: GenRuntimeConfig;
}
export function createImportBuffer(
  config: CreateImportBufferConfig,
): ImportBuffer {
  type Froms = { [from: string]: Items };
  type Items = { [as: string]: string };
  type ConflictTable = { [as: string]: ConflictCountTable };
  type ConflictCountTable = { [fromAndItem: string]: number };
  const froms: Froms = {};
  const conflictTable: ConflictTable = {};
  const reservedNames = config.reservedNames ?? [];
  const runtime = config.runtime ?? { packageName: "@pbkit/runtime" };
  for (const reservedName of reservedNames) {
    conflictTable[reservedName] = { "": 0 };
  }
  const importBuffer: ImportBuffer = {
    addInternalImport(here, from, item, as) {
      const _from = relative(dirname(here), from);
      const __from = (_from[0] !== ".") ? `./${_from}` : _from;
      return importBuffer.addImport(__from, item, as);
    },
    addImport(from, item, as) {
      const _as = as ?? item;
      const fromAndItem = `${from},${item}`;
      const items = froms[from] = froms[from] ?? {};
      const conflictCountTable = conflictTable[_as] = conflictTable[_as] ?? {};
      let conflictCount: number;
      if (fromAndItem in conflictCountTable) {
        conflictCount = conflictCountTable[fromAndItem];
      } else {
        conflictCount = Object.keys(conflictCountTable).length;
        conflictCountTable[fromAndItem] = conflictCount;
      }
      const __as = conflictCount ? `${_as}_${conflictCount}` : _as;
      items[__as] = item;
      return __as;
    },
    addRuntimeImport(here, from, item, as) {
      if (runtime.packageName == null) {
        const _from = join(runtime.outDir, from);
        return importBuffer.addInternalImport(here, _from, item, as);
      } else {
        const _from = join(runtime.packageName, from);
        return importBuffer.addImport(_from, item, as);
      }
    },
    getCode() {
      return Object.entries(froms).map(([from, items]) => {
        const itemsCode = Object.entries(items).map(([as, item]) => {
          if (as === item) return `  ${item},\n`;
          return `  ${item} as ${as},\n`;
        }).join("");
        return `import {\n${itemsCode}} from "${from}";\n`;
      }).join("");
    },
  };
  return importBuffer;
}
