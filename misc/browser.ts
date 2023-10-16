import which from "./which.ts";

export async function open(url: string) {
  return await Deno.run({
    cmd: [...await getBrowserCmds(Deno.build.os), url],
  }).status();
}

async function getBrowserCmds(
  browser: typeof Deno["build"]["os"],
): Promise<string[]> {
  if (browser === "darwin") return ["open"];
  if (browser === "windows") return ["cmd", "/c", "start"];
  return [
    await which("xdg-open") ??
      await which("x-www-browser") ??
      await which("wslview") ??
      "sensible-browser",
  ];
}
