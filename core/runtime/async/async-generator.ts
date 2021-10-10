export async function* fromSingle<T>(value: T): AsyncGenerator<T> {
  yield value;
}

export async function first<T>(
  generator: AsyncGenerator<T>,
): Promise<T> {
  for await (const value of generator) return value;
  throw Error("The generator should yield at least one value.");
}
