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
  template: ArrayLike<string>,
  ...substitutions: (CodeFragment | string | number | boolean)[]
): CodeFragment {
  return new CodeFragment(
    "js",
    interleave(
      template,
      substitutions.map((s) => s instanceof CodeFragment ? s : String(s)),
    ),
  );
}

export function ts(
  template: ArrayLike<string>,
  ...substitutions: (CodeFragment | string | number | boolean)[]
): CodeFragment {
  return new CodeFragment(
    "ts",
    interleave(
      template,
      substitutions.map((s) => s instanceof CodeFragment ? s : String(s)),
    ),
  );
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
