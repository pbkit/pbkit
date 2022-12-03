import { dirname, relative } from "../path.ts";
import { Ref } from "./code-fragment.ts";

export interface AddImportConfig {
  from: string;
  item: string;
  as?: string;
  type?: boolean;
}
export type AddImport = (config: AddImportConfig) => Ref;
export interface AddInternalImportConfig extends AddImportConfig {
  here: string;
}
export type AddInternalImport = (config: AddInternalImportConfig) => Ref;

export interface ImportTriple {
  from: string;
  item: string;
  as: Ref;
}
export interface ImportBuffer {
  addInternalImport: AddInternalImport;
  addImport: AddImport;
  addRuntimeImport: AddInternalImport;
  isTypeImport: (ref: Ref) => boolean;
  getImportFromRef: (ref: Ref) => ImportTriple | undefined;
  imports(): Generator<ImportTriple>;
  froms(): Generator<{ from: string; imports(): Generator<ImportTriple> }>;
}

export type CreateImportBufferFn = typeof createImportBuffer;

export function createImportBuffer(
  getAddRuntimeImportFn?: (
    addInternalImport: AddInternalImport,
    addImport: AddImport,
  ) => AddInternalImport,
): ImportBuffer {
  type Froms = { [from: string]: Items };
  type Items = { [item: string]: Ref };
  type TypeTable = { [fromAndItemAndAs: string]: boolean };
  const froms: Froms = {};
  const typeTable: TypeTable = {};
  const refTable: Map<Ref, ImportTriple> = new Map();
  const addInternalImport: AddInternalImport = (
    { here, from, item, as, type },
  ) => {
    const _from = relative(dirname(here), from);
    const __from = (_from[0] !== ".") ? `./${_from}` : _from;
    return addImport({ from: __from, item, as, type });
  };
  const addImport: AddImport = ({ from, item, as, type }) => {
    const _as = as ?? item;
    const items = froms[from] ??= {};
    const ref = items[item] ??= new Ref(_as);
    refTable.set(ref, { from, item, as: ref });
    typeTable[`${from},${item},${_as}`] = Boolean(type);
    return ref;
  };
  const addRuntimeImport: AddInternalImport = (
    getAddRuntimeImportFn?.(
      addInternalImport,
      addImport,
    ) ?? addInternalImport
  );
  const importBuffer: ImportBuffer = {
    addInternalImport,
    addImport,
    addRuntimeImport,
    isTypeImport(ref) {
      const triple = refTable.get(ref)!;
      const { from, item, as } = triple;
      return Boolean(typeTable[`${from},${item},${as.preferredName}`]);
    },
    getImportFromRef(ref) {
      return refTable.get(ref);
    },
    *imports() {
      for (const ref of refTable.keys()) yield refTable.get(ref)!;
    },
    *froms() {
      for (const [from, _items] of Object.entries(froms)) {
        yield {
          from,
          *imports() {
            for (const [item, as] of Object.entries(_items)) {
              yield { from, item, as };
            }
          },
        };
      }
    },
  };
  return importBuffer;
}
