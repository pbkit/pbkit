import which from "./which.ts";

export async function open(url: string) {
  return await Deno.run({
    cmd: [...await getBrowserCmds[Deno.build.os](), url],
  }).status();
}

const getBrowserCmds: {
  [browser in typeof Deno["build"]["os"]]: () => Promise<string[]>;
} = {
  async darwin() {
    return ["open"];
  },
  async linux() {
    return [
      await which("xdg-open") ??
        await which("x-www-browser") ??
        await which("wslview") ??
        "sensible-browser",
    ];
  },
  async windows() {
    return ["cmd", "/c", "start"];
  },
};
