export async function* fromSingle<T>(value: T): AsyncGenerator<T> {
  yield value;
}

export async function first<T>(
  generator: AsyncGenerator<T>,
): Promise<T> {
  const { done, value } = await generator.next();
  if (done) throw Error("The generator should yield at least one value.");
  return value;
}

export async function* map<T>(
  asyncGenerator: AsyncGenerator<T>,
  fn: (value: T) => T | Promise<T>,
): AsyncGenerator<T> {
  for await (const value of asyncGenerator) yield await fn(value);
}
