export function removeItem<T>(arr: T[], item: T): T[] {
  const index = arr.indexOf(item);
  arr.splice(index, 1);
  return arr;
}
