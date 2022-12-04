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
  const froms: Froms = {};
  const typeTable: Map<Ref, boolean> = new Map();
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
    if (item in items) return items[item];
    const ref = items[item] = new Ref(_as);
    typeTable.set(ref, Boolean(type));
    refTable.set(ref, { from, item, as: ref });
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
      return Boolean(typeTable.get(ref));
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
