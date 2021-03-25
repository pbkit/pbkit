import * as ast from "../../../core/ast/index.ts";
import {
  Visitor,
  visitor as defaultVisitor,
} from "../../../core/visitor/index.ts";
import { parseConstant } from "../../../core/parser/proto.ts";
import { createPrinter } from "../../../core/stringifier/printer.ts";
import {
  PollapoRootReplaceFileOption,
  PollapoRootReplaceFileOptionItem,
} from "../pollapoYml.ts";

export default function replaceFileOption(
  ast: ast.Proto,
  config: PollapoRootReplaceFileOption,
): ast.Proto {
  return {
    ...ast,
    statements: ast.statements.map((statement) => {
      if (statement.type !== "option") return statement;
      const optionNameText = trivialToString(statement.optionName);
      if (!config[optionNameText]) return statement;
      return {
        ...statement,
        constant: replaceConstant(statement.constant, config[optionNameText]),
      };
    }),
  };
}

function replaceConstant(
  original: ast.Constant,
  { regex, value }: PollapoRootReplaceFileOptionItem,
): ast.Constant {
  const old = trivialToString(original);
  return parseConstant(old.replace(new RegExp(regex), value)).ast;
}

function trivialToString(trivial: ast.OptionName | ast.Constant): string {
  const printer = createPrinter();
  const stringifier: Visitor = {
    ...defaultVisitor,
    visitToken(_, node) {
      printer.print(node.text);
    },
  };
  if (trivial.type === "option-name") {
    stringifier.visitOptionName(stringifier, trivial);
  } else {
    stringifier.visitConstant(stringifier, trivial);
  }
  return printer.done();
}
