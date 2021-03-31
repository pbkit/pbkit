import { emptyDir, ensureDir } from "https://deno.land/std@0.88.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { jsonTree } from "https://deno.land/x/json_tree/mod.ts";
import { parse } from "../../../core/parser/proto.ts";
import minify from "../../../core/stringifier/minify.ts";
import replaceFileOption from "../postprocess/replaceFileOption.ts";
import { fetchArchive, readGhHosts } from "../misc/github.ts";
import { iterFiles, stripComponents, unzip } from "../misc/archive/zip.ts";
import { print, println } from "../misc/stdio.ts";
import { getCacheDir } from "../config.ts";
import {
  analyzeDeps,
  AnalyzeDepsResultRevs,
  cacheDeps,
  depToString,
  getPollapoYml,
  getZipPath,
  parseDep,
  PollapoDep,
  PollapoYml,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";
import { compareRev } from "../rev.ts";
interface Options {
  clean?: true;
  outDir: string;
  token?: string;
  target: string;
}

export default new Command()
  .description("Install dependencies.")
  .option("-t, --target <value:string>", "asdsa", {
    default: "riiid/interface-content-model",
  })
  .option("-c, --clean", "Don't use cache")
  .option("-o, --out-dir <value:string>", "Out directory", {
    default: ".pollapo",
  })
  .action(async (options: any) => {
    try {
      const targetDep = options.target;
      const cacheDir = getCacheDir();
      const pollapoYml = await getPollapoYml();

      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });

      const makeWhyTree = (depName: string) => {
        if (depName === "<root>") {
          return null;
        }

        const tree: Record<string, any> = {};
        const [name, version] = depName.split("@");

        analyzeDepsResult[name][version].froms.map((from: string) => {
          tree[from] = makeWhyTree(from);
        });

        return tree;
      };

      Object.keys(analyzeDepsResult[targetDep]).map((version) => {
        console.log(jsonTree(makeWhyTree(`${targetDep}@${version}`), true));
      });
    } catch (err) {
      if (
        err instanceof PollapoNotLoggedInError ||
        err instanceof PollapoYmlNotFoundError
      ) {
        console.error(err.message);
        return Deno.exit(1);
      }
      // TODO: handle not found error
      throw err;
    }
  });

class PollapoNotLoggedInError extends Error {
  constructor() {
    super("Login required.");
  }
}
