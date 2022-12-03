import { createImportBuffer, ImportBuffer } from "./import-buffer.ts";

export type CodeFragmentType = "js" | "ts";
export type RenderRef = (ref: Ref) => string;
export class CodeFragment {
  constructor(
    public type: CodeFragmentType,
    public children: (CodeFragment | Ref | string)[],
  ) {}
  toString(type: CodeFragmentType = "ts", renderRef?: RenderRef): string {
    if ((type === "js") && (this.type === "ts")) return "";
    return this.children.map((child) => {
      if (typeof child === "string") return child;
      if (child instanceof Ref && renderRef) return renderRef(child);
      return child.toString(type, renderRef);
    }).join("");
  }
  *refs(): Generator<Ref> {
    for (const child of this.children) {
      if (typeof child === "string") continue;
      if (child instanceof Ref) {
        yield child;
        continue;
      }
      yield* child.refs();
    }
  }
}

export class Ref {
  public resolvedName: string | undefined;
  constructor(public preferredName: string) {}
  toString() {
    return this.resolvedName || this.preferredName;
  }
}

export function js(
  template: ArrayLike<CodeFragment | Ref | string>,
  ...substitutions: (CodeFragment | Ref | string | number | boolean)[]
): CodeFragment {
  return new CodeFragment(
    "js",
    interleave(template, substitutions).map(
      (s) => (s instanceof CodeFragment || s instanceof Ref) ? s : String(s),
    ),
  );
}

export function ts(
  template: ArrayLike<CodeFragment | Ref | string>,
  ...substitutions: (CodeFragment | Ref | string | number | boolean)[]
): CodeFragment {
  return new CodeFragment(
    "ts",
    interleave(template, substitutions).map(
      (s) => (s instanceof CodeFragment || s instanceof Ref) ? s : String(s),
    ),
  );
}

export type ModuleFragment = CodeFragment | Export;
export class Module {
  private fragments: ModuleFragment[] = [];
  constructor(
    public filePath: string,
    public importBuffer: ImportBuffer = createImportBuffer(),
    public reservedNames: string[] = [],
  ) {}
  *[Symbol.iterator](): Generator<ModuleFragment> {
    for (const fragment of this.fragments) yield fragment;
  }
  resolveRefs() {
    const reservedNames = this.reservedNames ?? [];
    const conflictCount: { [preferredName: string]: number } = (
      Object.fromEntries(reservedNames.map((name) => [name, 0]))
    );
    const refNumberMap = new Map<Ref, number>();
    const refs = this.fragments.flatMap((moduleFragment) => {
      if (moduleFragment instanceof Export) {
        return Array.from(moduleFragment.codeFragment.refs());
      } else {
        return Array.from(moduleFragment.refs());
      }
    });
    for (const ref of refs) {
      if (!refNumberMap.has(ref)) {
        refNumberMap.set(
          ref,
          (ref.preferredName in conflictCount)
            ? (++conflictCount[ref.preferredName])
            : (conflictCount[ref.preferredName] = 0),
        );
      }
      const num = refNumberMap.get(ref)!;
      ref.resolvedName = (num < 1)
        ? ref.preferredName
        : `${ref.preferredName}_${num}`;
    }
  }
  add(fragments: ModuleFragment | ModuleFragment[]) {
    if (Array.isArray(fragments)) this.fragments.push(...fragments.flat());
    else this.fragments.push(fragments);
    return this;
  }
  code(codeFragment: CodeFragment) {
    this.fragments.push(codeFragment);
    return this;
  }
  export(name: string, codeFragment: CodeFragment) {
    this.fragments.push(new Export(name, codeFragment));
    return this;
  }
}

export class Export {
  constructor(public name: string, public codeFragment: CodeFragment) {}
}

export class DefaultExport extends Export {
  constructor(codeFragment: CodeFragment) {
    super("default", codeFragment);
  }
}

function interleave<T, U>(a: ArrayLike<T>, b: ArrayLike<U>): (T | U)[] {
  const result: (T | U)[] = [];
  const aa = arraylike(a);
  const bb = arraylike(b);
  while (true) {
    const { done: aad, value: av } = aa.next();
    if (!aad) result.push(av);
    const { done: bbd, value: bv } = bb.next();
    if (!bbd) result.push(bv);
    if (aad && bbd) break;
  }
  return result;
}

function* arraylike<T>(items: ArrayLike<T>): Generator<T> {
  for (let i = 0; i < items.length; ++i) yield items[i];
}
