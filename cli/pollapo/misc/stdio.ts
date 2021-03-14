export async function print(text: string): Promise<void> {
  await Deno.stdout.write(new TextEncoder().encode(text));
}

export async function println(text: string): Promise<void> {
  await print(text + "\n");
}
