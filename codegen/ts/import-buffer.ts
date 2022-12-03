import { dirname, relative } from "../path.ts";

export interface AddImportConfig {
  from: string;
  item: string;
  as?: string;
  type?: boolean;
}
export type AddImport = (config: AddImportConfig) => string;
export interface AddInternalImportConfig extends AddImportConfig {
  here: string;
}
export type AddInternalImport = (config: AddInternalImportConfig) => string;

export interface Import {
  from: string;
  item: string;
  as: string;
}
export interface ImportBuffer {
  addInternalImport: AddInternalImport;
  addImport: AddImport;
  addRuntimeImport: AddInternalImport;
  getTable: () => Froms;
  isTypeImport: ({ from, item, as }: Import) => boolean;
  [Symbol.iterator](): Generator<Import>;
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
  type TypeTable = { [fromAndItemAndAs: string]: boolean };
  const froms: Froms = {};
  const conflictTable: ConflictTable = {};
  const typeTable: TypeTable = {};
  const reservedNames = config.reservedNames ?? [];
  for (const reservedName of reservedNames) {
    conflictTable[reservedName] = { "": 0 };
  }
  const addInternalImport: AddInternalImport = (
    { here, from, item, as, type },
  ) => {
    const _from = relative(dirname(here), from);
    const __from = (_from[0] !== ".") ? `./${_from}` : _from;
    return addImport({ from: __from, item, as, type });
  };
  const addImport: AddImport = ({ from, item, as, type }) => {
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
    typeTable[`${from},${item},${__as}`] = Boolean(type);
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
    isTypeImport: ({ from, item, as }) =>
      Boolean(typeTable[`${from},${item},${as}`]),
    *[Symbol.iterator]() {
      for (const [from, items] of Object.entries(froms)) {
        for (const [as, item] of Object.entries(items)) {
          yield { from, item, as };
        }
      }
    },
  };
  return importBuffer;
}
