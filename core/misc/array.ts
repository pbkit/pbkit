export type PojoSet<T extends string | number> = { [key in T]: T };
export function toPojoSet<T extends string | number>(
  arr: readonly T[],
): PojoSet<T> {
  const result: any = {};
  for (const item of arr) result[item] = item;
  return result;
}
