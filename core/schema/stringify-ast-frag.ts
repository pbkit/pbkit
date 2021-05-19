import * as ast from "../ast/index.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";

function createNaiveAstStringifier() {
  const result: string[] = [];
  const visitor: Visitor = {
    ...defaultVisitor,
    visitComment() {},
    visitToken(_, node) {
      result.push(node.text);
    },
  };
  return { visitor, finish: () => result.join("") };
}

export function stringifyType(type: ast.Type): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitType(stringifier.visitor, type);
  return stringifier.finish();
}

export function stringifyFullIdent(fullIdent: ast.FullIdent): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitFullIdent(stringifier.visitor, fullIdent);
  return stringifier.finish();
}

export function stringifyOptionName(optionName: ast.OptionName): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitOptionName(stringifier.visitor, optionName);
  return stringifier.finish();
}
