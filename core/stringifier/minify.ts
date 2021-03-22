import * as ast from "../ast/index.ts";
import { Visitor, visitor } from "../visitor/index.ts";
import { createPrinter } from "./printer.ts";

export default function minify(ast: ast.Proto): string {
  const printer = createPrinter();
  const minifier: Visitor = {
    ...visitor,
    visitToken(_, node) {
      printer.print(node.text);
    },
  };
  minifier.visitProto(minifier, ast);
  return printer.done();
}
