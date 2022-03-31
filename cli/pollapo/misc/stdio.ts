export async function print(text: string, err = false): Promise<void> {
  if (err) {
    await Deno.stderr.write(new TextEncoder().encode(text));
  } else {
    await Deno.stdout.write(new TextEncoder().encode(text));
  }
}

export async function println(text: string, err = false): Promise<void> {
  await print(text + "\n", err);
}
