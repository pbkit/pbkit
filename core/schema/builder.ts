import * as ast from "../ast/index.ts";
import { Loader } from "../loader/index.ts";
import { parse } from "../parser/proto.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { File, Import, Schema } from "./model.ts";

export interface BuildConfig {
  loader: Loader;
  files: string[];
}
export async function build(config: BuildConfig): Promise<Schema> {
  const result: Schema = {
    files: {},
    types: {},
    extends: {},
    services: {},
  };
  for (const file of config.files) {
    const loadResult = await config.loader.load(file);
    if (!loadResult) continue;
    const parseResult = parse(loadResult.data);
    result.files[file] = {
      parseResult,
      syntax: getSyntax(parseResult.ast),
      package: getPackage(parseResult.ast),
      imports: getImports(parseResult.ast),
      options: getOptions(parseResult.ast),
    };
    // TODO: types, extends, services
  }
  return result;
}

function getSyntax(ast: ast.Proto): File["syntax"] {
  const syntaxStatement = findStatementByType(ast.statements, "syntax");
  const syntax = syntaxStatement?.syntax.text;
  return syntax === "proto3" ? "proto3" : "proto2";
}

function getPackage(ast: ast.Proto): File["package"] {
  const packageStatement = findStatementByType(ast.statements, "package");
  if (!packageStatement) return "";
  return stringifyFullIdent(packageStatement.fullIdent);
}

function getImports(ast: ast.Proto): File["imports"] {
  const importStatements = filterStatementsByType(ast.statements, "import");
  return importStatements.map((statement) => {
    const kind = (statement.weakOrPublic?.text || "") as Import["kind"];
    const filePath = evalStrLit(statement.strLit);
    return {
      kind,
      filePath,
    };
  });
}

function getOptions(ast: ast.Proto): File["options"] {
  const optionStatements = filterStatementsByType(ast.statements, "option");
  const result: File["options"] = {};
  for (const statement of optionStatements) {
    const optionName = stringifyOptionName(statement.optionName);
    const optionValue = evalConstant(statement.constant);
    result[optionName] = optionValue;
  }
  return result;
}

function evalConstant(constant: ast.Constant): boolean | number | string {
  switch (constant.type) {
    case "aggregate":
      return "";
    case "bool-lit":
      return evalBoolLit(constant.text);
    case "full-ident":
      return stringifyFullIdent(constant);
    case "signed-float-lit":
      return evalSignedFloatLit(constant);
    case "signed-int-lit":
      return evalSignedIntLit(constant);
    case "str-lit":
      return evalStrLit(constant);
  }
}

function evalBoolLit(text: string): boolean {
  if (text === "true") return true;
  return false;
}

function evalIntLit(intLit: ast.IntLit): number {
  const text = intLit.text;
  if (text.startsWith("0x")) return parseInt(text, 16);
  if (text.startsWith("0")) return parseInt(text, 8);
  return parseInt(text, 10);
}

function evalSignedIntLit(signedIntLit: ast.SignedIntLit): number {
  const intLit = signedIntLit.value;
  if (signedIntLit.sign?.text === "-") return -evalIntLit(intLit);
  return evalIntLit(intLit);
}

function evalFloatLit(floatLit: ast.FloatLit): number {
  const text = floatLit.text;
  if (text === "inf") return Infinity;
  if (text === "nan") return NaN;
  return parseFloat(text);
}

function evalSignedFloatLit(signedFloatLit: ast.SignedFloatLit): number {
  const floatLit = signedFloatLit.value;
  if (signedFloatLit.sign?.text === "-") return -evalFloatLit(floatLit);
  return evalFloatLit(floatLit);
}

function evalStrLit(strLit: ast.StrLit): string {
  return JSON.parse(strLit.text); // TODO
}

function findStatementByType<TType extends ast.TopLevelStatement["type"]>(
  statements: ast.TopLevelStatement[],
  type: TType,
): Extract<ast.TopLevelStatement, { type: TType }> | undefined {
  return statements.find((statement) => statement.type === type) as any;
}

function filterStatementsByType<TType extends ast.TopLevelStatement["type"]>(
  statements: ast.TopLevelStatement[],
  type: TType,
): Extract<ast.TopLevelStatement, { type: TType }>[] {
  return statements.filter((statement) => statement.type === type) as any;
}

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

function stringifyFullIdent(fullIdent: ast.FullIdent): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitFullIdent(stringifier.visitor, fullIdent);
  return stringifier.finish();
}

function stringifyOptionName(optionName: ast.OptionName): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitOptionNameSegment(stringifier.visitor, optionName);
  return stringifier.finish();
}
