import { getCurrentVersion, setCurrentVersion } from "./current-version.ts";
import { getToplevelCommands } from "./toplevel-commands.ts";

export default async function unuseCurrentVersion(): Promise<void> {
  const currentVersion = getCurrentVersion();
  if (!currentVersion) return;
  setCurrentVersion();
  try {
    console.log(`Uninstalling ${currentVersion}...`);
    for (const command of getToplevelCommands(currentVersion)) {
      await Deno.run({ cmd: ["deno", "uninstall", command] }).status();
    }
  } catch {}
}
