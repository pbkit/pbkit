import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import {
  Select,
  SelectValueOptions,
} from "https://deno.land/x/cliffy@v0.19.5/prompt/select.ts";
import { stringify } from "https://deno.land/std@0.147.0/encoding/yaml.ts";
import { cyan, yellow } from "https://deno.land/std@0.147.0/fmt/colors.ts";
import {
  fetchBranches,
  fetchTags,
  getToken,
  GithubNotLoggedInError,
  GithubRepoNotFoundError,
} from "../../../misc/github/index.ts";
import {
  PollapoUnauthorizedError,
  validateToken,
} from "../../../misc/github/auth.ts";
import backoff from "../misc/exponential-backoff.ts";
import {
  loadPollapoYml,
  parseDepFrag,
  PollapoYml,
  PollapoYmlNotFoundError,
  sanitizeDeps,
} from "../pollapoYml.ts";
import { Confirm } from "https://deno.land/x/cliffy@v0.19.5/prompt/confirm.ts";
import * as path from "https://deno.land/std@0.147.0/path/mod.ts";

interface Options {
  token?: string;
  config: string;
}

export default new Command()
  .arguments("<targets...:string>")
  .description("Add dependencies.")
  .option("-C, --config <value:string>", "Pollapo config", {
    default: "pollapo.yml",
  })
  .action(async (options: Options, targets: string[]) => {
    try {
      await addDeps(options, targets);
    } catch (err) {
      if (
        err instanceof GithubNotLoggedInError ||
        err instanceof GithubRepoNotFoundError ||
        err instanceof PollapoYmlNotFoundError ||
        err instanceof PollapoUnauthorizedError ||
        err instanceof PollapoRevNotFoundError
      ) {
        console.error(err.message);

        if (err instanceof PollapoYmlNotFoundError) {
          const confirmed = await Confirm.prompt(
            `Create ${path.resolve("pollapo.yml")}?`,
          );
          if (confirmed) {
            Deno.create(path.resolve("pollapo.yml"));
            await addDeps(options, targets);
            return Deno.exit(0);
          }
        }
        return Deno.exit(1);
      }
    }
  });

async function addDeps(options: Options, targets: string[]) {
  const token = options.token ?? await getToken();
  await backoff(
    () => validateToken(token),
    (err, i) => err instanceof PollapoUnauthorizedError || i >= 2,
  );
  let pollapoYml = await loadPollapoYml(options.config);
  for (const target of targets) {
    pollapoYml = await add(pollapoYml, target, token);
  }
  const pollapoYmlText = stringify(
    sanitizeDeps(pollapoYml) as Record<string, unknown>,
  );
  await Deno.writeTextFile(options.config, pollapoYmlText);
}

async function add(
  pollapoYml: PollapoYml,
  dep: string,
  token: string,
): Promise<PollapoYml> {
  const { user, repo, rev } = parseDepFrag(dep);
  const fetchRepoConfig = { token, user, repo };
  const [tags, branches] = await Promise.all([
    backoff(() => fetchTags(fetchRepoConfig)),
    backoff(() => fetchBranches(fetchRepoConfig)),
  ]);
  if (rev) {
    if (![...tags, ...branches].find(({ name }) => name === rev)) {
      throw new PollapoRevNotFoundError(rev);
    }
    return pushDep(pollapoYml, dep);
  } else {
    const selectTargetMessage = (
      (tags.length && branches.length)
        ? "Tag or Branch"
        : tags.length
        ? "Tag"
        : "Branch"
    );
    const tagOptions = tags.map((tag) => ({ value: tag.name }));
    const branchOptions = branches.map((branch) => ({ value: branch.name }));
    const options: SelectValueOptions = (
      (tags.length && branches.length)
        ? [
          Select.separator(cyan("Tag")),
          ...tagOptions,
          Select.separator(cyan("Branch")),
          ...branchOptions,
        ]
        : [...tagOptions, ...branchOptions]
    );
    const selectedRevName = await Select.prompt({
      message: `Select ${selectTargetMessage} in ${yellow(user + "/" + repo)}`,
      search: true,
      options,
    });
    return pushDep(pollapoYml, `${user}/${repo}@${selectedRevName}`);
  }
}

function pushDep(pollapoYml: PollapoYml, dep: string): PollapoYml {
  const deps = pollapoYml?.deps ?? [];
  deps.push(dep);
  return { ...pollapoYml, deps };
}

class PollapoRevNotFoundError extends Error {
  constructor(rev: string) {
    super(`Revision \`${rev}\` is not found.`);
  }
}
