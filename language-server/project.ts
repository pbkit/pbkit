import { join } from "https://deno.land/std@0.175.0/path/mod.ts";
import { getVendorDir } from "../cli/pb/config.ts";
import expandEntryPaths from "../cli/pb/cmds/gen/expandEntryPaths.ts";
import { loadPollapoYml } from "../cli/pollapo/pollapoYml.ts";
import { parseBufWorkYaml } from "../compat/buf/workspace.ts";
import { parseBufYaml } from "../compat/buf/module.ts";
import { Loader } from "../core/loader/index.ts";
import combineLoader from "../core/loader/combineLoader.ts";
import memoizeLoader, { MemoizedLoader } from "../core/loader/memoizeLoader.ts";
import {
  createLoader as createDenoFsLoader,
  fromFileUrl,
  resolve,
} from "../core/loader/deno-fs.ts";
import type { EntryModule } from "../core/loader/entry-module.ts";
import { expandEntryModules } from "../core/loader/deno-entry-module.ts";
import { OpenProtoManager } from "./open-proto-manager.ts";

export interface ProjectManager {
  addProjectPath(projectPath: string): Promise<void>;
  getProjectPath(filePath: string): string | undefined;
  getProjectProtoFiles(filePath: string): Promise<string[]>;
  getProjectLoader(projectPath?: string): Promise<MemoizedLoader>;
  createProjectLoader(projectPath?: string): Promise<MemoizedLoader>;
}

export function createProjectManager(
  openProtoManager: OpenProtoManager,
): ProjectManager {
  // sorted string array in descending order
  // ex) ['file:///foo/baz', 'file:///foo/bar/baz', 'file:///foo/bar', 'file:///foo']
  const projectPaths: string[] = [];
  const loaders: { [projectPath: string]: MemoizedLoader } = {};
  return {
    addProjectPath,
    getProjectPath,
    getProjectProtoFiles,
    async getProjectLoader(projectPath) {
      if (!projectPath) return await createProjectLoader(projectPath);
      return loaders[projectPath] ??= await createProjectLoader(projectPath);
    },
    createProjectLoader,
  };
  async function addProjectPath(projectPath: string): Promise<void> {
    projectPaths.push(projectPath);
    projectPaths.sort().reverse();
  }
  function getProjectPath(filePath: string): string | undefined {
    return projectPaths.find((p) => filePath.startsWith(p));
  }
  async function getProjectDependencyPaths(
    projectPath: string,
  ): Promise<string[]> {
    const result: string[] = [];
    const pollapoPath = join(projectPath, ".pollapo");
    try {
      if ((await Deno.lstat(pollapoPath)).isDirectory) result.push(pollapoPath);
    } catch {}
    return result;
  }
  async function getProjectProtoFiles(filePath: string): Promise<string[]> {
    const projectPath = getProjectPath(filePath);
    if (projectPath) {
      const { roots, modules } = await getBufConfig(projectPath);
      return [
        ...await expandEntryPaths([projectPath, ...roots]),
        ...await expandEntryModules(modules),
      ];
    } else {
      return [filePath];
    }
  }
  async function createProjectLoader(
    projectPath?: string,
  ): Promise<MemoizedLoader> {
    const { roots, modules } = await (async () => {
      if (!projectPath) return { roots: getVendorDirs(), modules: [] };
      const bufConfig = await getBufConfig(projectPath);
      return {
        roots: [
          projectPath,
          ...bufConfig.roots,
          ...await getProjectDependencyPaths(projectPath),
          ...getVendorDirs(),
        ],
        modules: bufConfig.modules,
      };
    })();
    const repo = projectPath && await getPollapoRepo(projectPath);
    return memoizeLoader(combineLoader(
      createOpenProtoLoader(openProtoManager),
      repo && createPollapoRepoLoader(projectPath, repo),
      createDenoFsLoader({ roots, modules }),
    ));
  }
}

function getVendorDirs() {
  if (Deno.build.os === "windows") {
    return [getVendorDir()];
  } else {
    return [getVendorDir(), "/usr/local/include"];
  }
}

interface BufConfig {
  roots: string[];
  modules: EntryModule[];
}
async function getBufConfig(projectPath: string): Promise<BufConfig> {
  try {
    const bufWorkYamlPath = resolve(projectPath, "buf.work.yaml");
    const bufWorkYaml = parseBufWorkYaml(
      await Deno.readTextFile(fromFileUrl(bufWorkYamlPath)),
    );
    return {
      roots: bufWorkYaml.directories.map(
        (directory) => resolve(projectPath, String(directory)),
      ),
      modules: [],
    };
  } catch {
    try {
      const bufYamlPath = resolve(projectPath, "buf.yaml");
      const bufYaml = parseBufYaml(
        await Deno.readTextFile(fromFileUrl(bufYamlPath)),
      );
      const version = bufYaml.version;
      if (version === "v1" || version === "v1beta1") {
        return {
          roots: bufYaml.build?.roots?.map(
            (directory) => resolve(projectPath, String(directory)),
          ) || [],
          modules: [],
        };
      }
      // v2
      return { roots: [], modules: bufYaml.modules || [] };
    } catch {
      return { roots: [], modules: [] };
    }
  }
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

function createOpenProtoLoader(openProtoManager: OpenProtoManager): Loader {
  return {
    async load(absolutePath) {
      const data = openProtoManager.getLastParsed(absolutePath);
      if (data == null) return null;
      return { absolutePath, data };
    },
  };
}

function createPollapoRepoLoader(projectPath: string, repo: string): Loader {
  return {
    async load(path) {
      if (!path.startsWith(repo + "/")) return null;
      const absolutePath = resolve(projectPath, path.slice(repo.length + 1));
      const filePath = fromFileUrl(absolutePath);
      try {
        return { absolutePath, data: await Deno.readTextFile(filePath) };
      } catch {
        return null;
      }
    },
  };
}
