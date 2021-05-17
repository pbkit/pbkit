import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { Select } from "https://deno.land/x/cliffy@v0.18.0/prompt/select.ts";
import { stringify } from "https://deno.land/std@0.93.0/encoding/yaml.ts";
import {
  getIsRepoExists,
  getRepoRevGroup,
  getToken,
  PollapoNotLoggedInError,
} from "../misc/github.ts";
import {
  PollapoUnauthorizedError,
  validateToken,
} from "../misc/github-auth.ts";
import backoff from "../misc/exponential-backoff.ts";
import {
  loadPollapoYml,
  parseOptionalDep,
  PollapoYml,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";

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
      const token = options.token ?? await getToken();
      await backoff(
        () => validateToken(token),
        (err, i) => err instanceof PollapoUnauthorizedError || i >= 2,
      );

      const pollapoYml = await loadPollapoYml(options.config);

      for (const target of targets) {
        await add(pollapoYml, target, token);
      }

      const pollapoYmlText = stringify({
        ...pollapoYml,
        deps: pollapoYml?.deps
          ?.reduce(
            (uniqDeps: string[], dep) =>
              uniqDeps.includes(dep) ? uniqDeps : [...uniqDeps, dep],
            [],
          )
          .sort(),
      });

      await Deno.writeTextFile(options.config, pollapoYmlText);
    } catch (err) {
      if (
        err instanceof PollapoNotLoggedInError ||
        err instanceof PollapoYmlNotFoundError ||
        err instanceof PollapoUnauthorizedError ||
        err instanceof PollapoRevNotFoundError ||
        err instanceof PollapoRepoNotFoundError
      ) {
        console.error(err.message);
        return Deno.exit(1);
      }
    }
  });

async function add(
  pollapoYml: PollapoYml,
  dep: string,
  token: string,
): Promise<void> {
  const { user, repo, rev } = parseOptionalDep(dep);

  const isRepoExists = await backoff(() =>
    getIsRepoExists({ token, user, repo })
  );

  if (!isRepoExists) {
    throw new PollapoRepoNotFoundError(repo);
  }

  const { tags, branches } = await backoff(() =>
    getRepoRevGroup({ token, user, repo })
  );

  if (!!rev) {
    const allRev = [
      ...tags,
      ...branches,
    ];

    const isRevExists = !!allRev.find(({ name }) => name === rev);

    if (isRevExists) {
      pollapoYml?.deps?.push(dep);
    } else {
      throw new PollapoRevNotFoundError(rev);
    }
  } else {
    const selectedRevName = await Select.prompt({
      message: `Select a Tag or Branch in \`${user}/${repo}\``,
      search: true,
      options: [
        Select.separator("----Tags----"),
        ...tags.map((tag) => ({ value: tag.name })),
        Select.separator("----Branches----"),
        ...branches.map((branch) => ({ value: branch.name })),
      ],
    });

    pollapoYml?.deps?.push(`${user}/${repo}@${selectedRevName}`);
  }
}

class PollapoRevNotFoundError extends Error {
  constructor(rev: string) {
    super(`Revision \`${rev}\` is not found.`);
  }
}

class PollapoRepoNotFoundError extends Error {
  constructor(repo: string) {
    super(`Repository \`${repo}\` is not found.`);
  }
}
