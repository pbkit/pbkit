export interface TypePathTree {
  [typeFrag: string]: TypePathTree;
}
export function createTypePathTree(typePaths: string[]): TypePathTree {
  const result: TypePathTree = {};
  const subPaths: { [head: string]: string[] } = {};
  for (const typePath of typePaths) {
    const head = getHead(typePath);
    if (!head) continue;
    subPaths[head] = subPaths[head] ?? [];
    subPaths[head].push(typePath.substr(head.length));
  }
  for (const [head, typePaths] of Object.entries(subPaths)) {
    delete subPaths[head];
    result[head] = createTypePathTree(typePaths);
  }
  return result;
}
const fragRegex = /^\.[^.]+/;
function getHead(typePath: string): string | undefined {
  return typePath.match(fragRegex)?.[0];
}

export function* iterTypePathTree(
  tree: TypePathTree,
  currentScope = "",
): Generator<[typePath: string, subTree: TypePathTree]> {
  for (const [head, subTree] of Object.entries(tree)) {
    const typePath = currentScope + head;
    yield [typePath, subTree];
    yield* iterTypePathTree(subTree, typePath);
  }
}
