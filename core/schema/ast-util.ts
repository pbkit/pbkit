import * as ast from "../ast/index.ts";

export function findNodeByType<TType extends ast.Node["type"]>(
  nodes: ast.Node[],
  type: TType,
): Extract<ast.Node, { type: TType }> | undefined {
  return nodes.find((node) => node.type === type) as any;
}

export function filterNodesByType<TType extends ast.Node["type"]>(
  nodes: ast.Node[],
  type: TType,
): Extract<ast.Node, { type: TType }>[] {
  return nodes.filter((node) => node.type === type) as any;
}

export function filterNodesByTypes<TType extends ast.Node["type"]>(
  nodes: ast.Node[],
  types: TType[],
): Extract<ast.Node, { type: TType }>[] {
  return nodes.filter((node) => types.includes(node.type as TType)) as any;
}
