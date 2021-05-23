export function getHomeDir() {
  return Deno.env.get(
    Deno.build.os === "windows" ? "USERPROFILE" : "HOME",
  ) || ".";
}
