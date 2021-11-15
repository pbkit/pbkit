export type Path = string[];
export type Node<T> = File<T> | Folder<T>;

interface NodeBase<TType> {
  type: TType;
}
export interface File<T> extends NodeBase<"file"> {
  value: T;
}
export interface Folder<T> extends NodeBase<"folder"> {
  value?: T;
  children: { [key: string]: Node<T> };
}

export const empty: Folder<any> = Object.freeze({
  type: "folder",
  children: Object.freeze({}),
});

export function file<T>(value: T): File<T> {
  return { type: "file", value };
}

export function textToPath(text: string, sep: string = "/"): Path {
  return text.split(sep).filter(Boolean);
}

export function* walkFiles<T>(
  node: Node<T>,
  path: Path = [],
): Generator<[Path, File<T>]> {
  if (node.type === "file") {
    yield [path, node];
    return;
  }
  for (const [name, child] of Object.entries(node.children)) {
    if (child.type === "file") yield [[...path, name], child];
    if (child.type === "folder") yield* walkFiles(child, [...path, name]);
  }
}

export function* walkFolders<T>(
  node: Node<T>,
  path: Path = [],
): Generator<[Path, Folder<T>]> {
  if (node.type === "file") return;
  yield [path, node];
  for (const [name, child] of Object.entries(node.children)) {
    if (child.type === "folder") yield* walkFolders(child, [...path, name]);
  }
}

export function has<T>(folder: Folder<T>, path: Path): boolean {
  if (path.length < 1) return true;
  const child = folder.children[path[0]];
  if (path.length === 1) return !!child;
  if (child.type === "file") return false;
  return has(child, path.slice(1));
}

export function get<T>(node: Node<T>, path: Path): Node<T> | undefined {
  if (path.length < 1) return node;
  if (node.type === "file") return;
  const child = node.children[path[0]];
  if (!child) return;
  if (path.length === 1) return child;
  return get(child, path.slice(1));
}

export function set<T>(folder: Folder<T>, path: Path, value: T): Folder<T>;
export function set<T>(node: Node<T>, path: Path, value: T): Node<T>;
export function set<T>(node: Node<T>, path: Path, value: T): Node<T> {
  if (path.length < 1) return { ...node, value };
  const key = path[0];
  const folder = node as Folder<T>;
  const child = folder?.children?.[key];
  return {
    ...node,
    type: "folder",
    children: {
      ...folder.children,
      [key]: (!child && (path.length === 1))
        ? file(value)
        : set(child ?? empty, path.slice(1), value),
    },
  };
}
