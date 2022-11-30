import { createImportBuffer, ImportBuffer } from "./import-buffer.ts";

export type CodeFragmentType = "js" | "ts";
export class CodeFragment {
  constructor(
    public type: CodeFragmentType,
    public children: (CodeFragment | string)[],
  ) {}
  toString(type: CodeFragmentType = "ts"): string {
    if ((type === "js") && (this.type === "ts")) return "";
    return this.children.map((child) => {
      if (typeof child === "string") return child;
      return child.toString(type);
    }).join("");
  }
}

export function js(
  template: ArrayLike<CodeFragment | string>,
  ...substitutions: (CodeFragment | string | number | boolean)[]
): CodeFragment {
  return new CodeFragment(
    "js",
    interleave(template, substitutions).map(
      (s) => s instanceof CodeFragment ? s : String(s),
    ),
  );
}

export function ts(
  template: ArrayLike<CodeFragment | string>,
  ...substitutions: (CodeFragment | string | number | boolean)[]
): CodeFragment {
  return new CodeFragment(
    "ts",
    interleave(template, substitutions).map(
      (s) => s instanceof CodeFragment ? s : String(s),
    ),
  );
}

export type ModuleFragment = CodeFragment | Export;
export class Module {
  private fragments: ModuleFragment[] = [];
  constructor(
    public filePath: string,
    public importBuffer: ImportBuffer = createImportBuffer({}),
  ) {}
  *[Symbol.iterator](): Generator<ModuleFragment> {
    for (const fragment of this.fragments) yield fragment;
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
