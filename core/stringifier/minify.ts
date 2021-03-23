import * as ast from "../ast/index.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { createPrinter } from "./printer.ts";

export default function minify(ast: ast.Proto): string {
  const printer = createPrinter();
  const minifier: Visitor = {
    ...defaultVisitor,
    visitFullIdent(visitor, node) {
      defaultVisitor.visitFullIdent(visitor, node);
      printer.print(" ");
    },
    visitType(visitor, node) {
      defaultVisitor.visitType(visitor, node);
      printer.print(" ");
    },
    visitKeyword(visitor, node) {
      defaultVisitor.visitKeyword(visitor, node);
      printer.print(" ");
    },
    visitToken(_, node) {
      printer.print(node.text);
    },
  };
  minifier.visitProto(minifier, ast);
  return printer.done();
}
