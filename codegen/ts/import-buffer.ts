import { dirname, relative } from "../path.ts";

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
  getTable: () => Froms;
}

export type Froms = { [from: string]: Items };
export type Items = { [as: string]: string };

export type CreateImportBufferFn = typeof createImportBuffer;

export interface CreateImportBufferConfig {
  reservedNames?: string[];
  getAddRuntimeImportFn?: (
    addInternalImport: AddInternalImport,
    addImport: AddImport,
  ) => AddInternalImport;
}
export function createImportBuffer(
  config: CreateImportBufferConfig,
): ImportBuffer {
  type ConflictTable = { [as: string]: ConflictCountTable };
  type ConflictCountTable = { [fromAndItem: string]: number };
  const froms: Froms = {};
  const conflictTable: ConflictTable = {};
  const reservedNames = config.reservedNames ?? [];
  for (const reservedName of reservedNames) {
    conflictTable[reservedName] = { "": 0 };
  }
  const addInternalImport: AddInternalImport = (here, from, item, as) => {
    const _from = relative(dirname(here), from);
    const __from = (_from[0] !== ".") ? `./${_from}` : _from;
    return addImport(__from, item, as);
  };
  const addImport: AddImport = (from, item, as) => {
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
  };
  const addRuntimeImport: AddInternalImport = (
    config.getAddRuntimeImportFn?.(
      addInternalImport,
      addImport,
    ) ?? addInternalImport
  );
  const importBuffer: ImportBuffer = {
    addInternalImport,
    addImport,
    addRuntimeImport,
    getTable: () => froms,
  };
  return importBuffer;
}
