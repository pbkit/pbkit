export async function* fromSingle<T>(value: T): AsyncGenerator<T> {
  yield value;
}

export async function first<T>(
  generator: AsyncGenerator<T>,
): Promise<T> {
  for await (const value of generator) return value;
  throw Error("The generator should yield at least one value.");
}

export async function* map<T>(
  asyncGenerator: AsyncGenerator<T>,
  fn: (value: T) => T | Promise<T>,
): AsyncGenerator<T> {
  for await (const value of asyncGenerator) yield await fn(value);
}
