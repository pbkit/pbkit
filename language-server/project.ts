import { exists } from "https://deno.land/std@0.122.0/fs/exists.ts";
import { getVendorDir } from "../cli/pb/config.ts";
import expandEntryPaths from "../cli/pb/cmds/gen/expandEntryPaths.ts";
import { loadPollapoYml } from "../cli/pollapo/pollapoYml.ts";
import { BuildConfig } from "../core/schema/builder.ts";
import { Loader } from "../core/loader/index.ts";
import combineLoader from "../core/loader/combineLoader.ts";
import memoizeLoader from "../core/loader/memoizeLoader.ts";
import {
  createLoader as createDenoFsLoader,
  fromFileUrl,
  resolve,
} from "../core/loader/deno-fs.ts";

export interface ProjectManager {
  addProjectPath(projectPath: string): Promise<void>;
  getProjectPath(filePath: string): string | undefined;
  createBuildConfig(filePath: string): Promise<BuildConfig>;
}

export function createProjectManager(): ProjectManager {
  // sorted string array in descending order
  // ex) ['file:///foo/baz', 'file:///foo/bar/baz', 'file:///foo/bar', 'file:///foo']
  const projectPaths: string[] = [];
  function getProjectPath(filePath: string): string | undefined {
    return projectPaths.find((p) => filePath.startsWith(p));
  }
  return {
    async addProjectPath(projectPath) {
      projectPaths.push(projectPath);
      projectPaths.sort().reverse();
    },
    getProjectPath,
    async createBuildConfig(filePath) {
      const projectPath = getProjectPath(filePath);
      if (!projectPath) {
        const roots = getVendorDirs();
        const denoFsLoader = createDenoFsLoader({ roots });
        return { loader: memoizeLoader(denoFsLoader), files: [filePath] };
      }
      const entryPaths = [projectPath + "/.pollapo", projectPath];
      const files = await expandEntryPaths(entryPaths);
      files.push(filePath);
      const roots = [...entryPaths, ...getVendorDirs()];
      const denoFsLoader = createDenoFsLoader({ roots });
      const repo = await getPollapoRepo(projectPath);
      if (!repo) return { loader: memoizeLoader(denoFsLoader), files };
      return {
        loader: memoizeLoader(combineLoader(
          createPollapoRepoLoader(projectPath, repo),
          denoFsLoader,
        )),
        files,
      };
    },
  };
}

function getVendorDirs() {
  return [getVendorDir(), "/usr/local/include"];
}

async function getPollapoRepo(
  projectPath: string,
): Promise<string | undefined> {
  try {
    const pollapoYmlPath = resolve(projectPath, "pollapo.yml");
    const pollapoYml = await loadPollapoYml(fromFileUrl(pollapoYmlPath));
    if (pollapoYml?.repo) return String(pollapoYml.repo);
  } catch {}
}

function createPollapoRepoLoader(projectPath: string, repo: string): Loader {
  return {
    async load(path) {
      if (!path.startsWith(repo + "/")) return null;
      const absolutePath = resolve(projectPath, path.slice(repo.length + 1));
      const filePath = fromFileUrl(absolutePath);
      if (!await exists(filePath)) return null;
      return { absolutePath, data: await Deno.readTextFile(filePath) };
    },
  };
}
