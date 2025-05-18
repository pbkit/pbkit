import which from "./which.ts";

export async function open(url: string) {
  const command = await getBrowserCmd(Deno.build.os, [url]);
  return await command.spawn().status;
}

async function getBrowserCmd(
  browser: typeof Deno["build"]["os"],
  args: string[] = [],
): Promise<Deno.Command> {
  if (browser === "darwin") {
    return new Deno.Command(
      "open",
      { args },
    );
  }
  if (browser === "windows") {
    return new Deno.Command("cmd", {
      args: ["/c", "start", ...args],
    });
  }
  return new Deno.Command(
    await which("xdg-open") ??
      await which("x-www-browser") ??
      await which("wslview") ??
      "sensible-browser",
    { args },
  );
}
