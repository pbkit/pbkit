import { bold, red, yellow } from "https://deno.land/std@0.147.0/fmt/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { jsonTree } from "https://deno.land/x/json_tree@latest/mod.ts";
import { println } from "../misc/stdio.ts";
import { getCacheDir } from "../config.ts";
import {
  analyzeDeps,
  getPollapoYml,
  PollapoYmlMalformedError,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";

interface Options {
  depth: number;
}

export default new Command()
  .arguments("<targets...:string>")
  .description("Show information about why dependency is installed.")
  .option(
    "-d, --depth <depth:number>",
    "Maximum depth of dependency tree to display",
    {
      default: 3,
    },
  )
  .action(async (options: Options, targets: string[]) => {
    try {
      const { depth } = options;
      const cacheDir = getCacheDir();
      const pollapoYml = await getPollapoYml();
      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });

      const makeWhyTree = (depName: string, depArray: string[]) => {
        if (depName === "<root>") {
          return null;
        }

        if (depArray.length > depth) {
          return "...";
        }

        type TreeNode = string | Tree | null;
        interface Tree {
          [key: string]: TreeNode;
        }

        const tree: Tree = {};
        const [name, version] = depName.split("@");
        if (
          !Object.keys(analyzeDepsResult).includes(name) ||
          !Object.keys(analyzeDepsResult[name]).includes(version)
        ) {
          throw new PollapoDependencyNotFoundError(depName);
        }
        analyzeDepsResult[name][version].froms.map((from: string) => {
          tree[from] = depArray.includes(from)
            ? "cycle"
            : makeWhyTree(from, [...depArray, from]);
        });

        return tree;
      };

      await println(bold(`Pollapo why`));
      await println(``);

      for (const target of targets) {
        if (target.includes("@")) {
          await println(yellow(`📚 ${target}`));
          await println(jsonTree(makeWhyTree(target, [target]), true));
        } else {
          if (
            !analyzeDepsResult[target]
          ) {
            throw new PollapoDependencyNotFoundError(target);
          }
          for await (const version of Object.keys(analyzeDepsResult[target])) {
            const depName = [target, version].join("@");
            await println(yellow(`📚 ${depName}`));
            await println(jsonTree(makeWhyTree(depName, [depName]), true));
          }
        }
      }
    } catch (err) {
      if (
        err instanceof PollapoYmlNotFoundError ||
        err instanceof PollapoDependencyNotFoundError ||
        err instanceof PollapoYmlMalformedError
      ) {
        console.error(red(err.message));
        return Deno.exit(1);
      }
      throw err;
    }
  });

class PollapoDependencyNotFoundError extends Error {
  constructor(missingDep: string) {
    super(`${missingDep}: Dependency not found.`);
  }
}
