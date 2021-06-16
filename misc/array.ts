export function removeItem<T>(arr: T[], item: T): T[] {
  const index = arr.indexOf(item);
  arr.splice(index, 1);
  return arr;
}

export function groupBy<T, U extends keyof T>(arr: T[], by: U): Map<T[U], T[]> {
  const result = new Map<T[U], T[]>();
  for (const item of arr) {
    const key = item[by];
    if (result.has(key)) result.get(key)!.push(item);
    else result.set(key, [item]);
  }
  return result;
}
