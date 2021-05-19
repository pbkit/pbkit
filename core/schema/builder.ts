import * as ast from "../ast/index.ts";
import { Loader } from "../loader/index.ts";
import { parse, ParseResult } from "../parser/proto.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { isDocComment, parseDocComment } from "./doc-comment.ts";
import {
  Enum,
  File,
  Import,
  Message,
  Options,
  RpcType,
  Schema,
  Service,
  Type,
} from "./model.ts";

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
  const iterFileResults = iterFiles(config.files, config.loader);
  for await (const { filePath, parseResult, file } of iterFileResults) {
    result.files[filePath] = file;
    const statements = parseResult.ast.statements;
    const services = iterServices(statements, file.package, filePath);
    for (const [typePath, service] of services) {
      result.services[typePath] = service;
    }
    const types = iterTypes(statements, file.package, filePath);
    for (const [typePath, type] of types) {
      result.types[typePath] = type;
    }
    // TODO: extends
  }
  return result;
}

interface IterFileResult {
  filePath: string;
  parseResult: ParseResult;
  file: File;
}
async function* iterFiles(
  files: string[],
  loader: Loader,
): AsyncGenerator<IterFileResult> {
  for (const filePath of files) {
    const loadResult = await loader.load(filePath);
    if (!loadResult) continue;
    const parseResult = parse(loadResult.data);
    const statements = parseResult.ast.statements;
    const file: File = {
      parseResult,
      syntax: getSyntax(statements),
      package: getPackage(statements),
      imports: getImports(statements),
      options: getOptions(statements),
    };
    yield { filePath, parseResult, file };
  }
}

type Statement =
  | ast.TopLevelStatement
  | ast.MessageBodyStatement
  | ast.EnumBodyStatement
  | ast.ExtendBodyStatement
  | ast.ServiceBodyStatement;

function getSyntax(statements: Statement[]): File["syntax"] {
  const syntaxStatement = findStatementByType(statements, "syntax");
  const syntax = syntaxStatement?.syntax.text;
  return syntax === "proto3" ? "proto3" : "proto2";
}

function getPackage(statements: Statement[]): string {
  const packageStatement = findStatementByType(statements, "package");
  if (!packageStatement) return "";
  return stringifyFullIdent(packageStatement.fullIdent);
}

function getImports(statements: Statement[]): Import[] {
  const importStatements = filterStatementsByType(statements, "import");
  return importStatements.map((statement) => {
    const kind = (statement.weakOrPublic?.text || "") as Import["kind"];
    const filePath = evalStrLit(statement.strLit);
    return {
      kind,
      filePath,
    };
  });
}

function getOptions(statements: Statement[]): Options {
  const optionStatements = filterStatementsByType(statements, "option");
  const result: Options = {};
  for (const statement of optionStatements) {
    const optionName = stringifyOptionName(statement.optionName);
    const optionValue = evalConstant(statement.constant);
    result[optionName] = optionValue;
  }
  return result;
}

function getFieldOptions(fieldOptions?: ast.FieldOptions): Options {
  if (!fieldOptions) return {};
  const result: Options = {};
  for (const fieldOption of fieldOptions.fieldOptionOrCommas) {
    if (fieldOption.type !== "field-option") continue;
    const optionName = stringifyOptionName(fieldOption.optionName);
    const optionValue = evalConstant(fieldOption.constant);
    result[optionName] = optionValue;
  }
  return result;
}

function* iterServices(
  statements: Statement[],
  typePath: string,
  filePath: string,
): Generator<[string, Service]> {
  const serviceStatements = filterStatementsByType(statements, "service");
  for (const statement of serviceStatements) {
    const serviceTypePath = typePath + "." + statement.serviceName.text;
    const service: Service = {
      filePath,
      options: getOptions(statement.serviceBody.statements),
      description: getDescription(statement.leadingComments),
      rpcs: getRpcs(statement.serviceBody.statements),
    };
    yield [serviceTypePath, service];
  }
}

function getRpcs(statements: Statement[]): Service["rpcs"] {
  const rpcStatements = filterStatementsByType(statements, "rpc");
  const rpcs: Service["rpcs"] = {};
  for (const statement of rpcStatements) {
    const options = statement.semiOrRpcBody.type === "rpc-body"
      ? getOptions(statement.semiOrRpcBody.statements)
      : {};
    rpcs[statement.rpcName.text] = {
      options,
      description: getDescription(statement.leadingComments),
      reqType: getRpcType(statement.reqType),
      resType: getRpcType(statement.resType),
    };
  }
  return rpcs;
}

function getRpcType(rpcType: ast.RpcType): RpcType {
  return {
    stream: !!rpcType.stream,
    type: stringifyType(rpcType.messageType),
  };
}

function* iterTypes(
  statements: Statement[],
  typePath: string,
  filePath: string,
): Generator<[string, Type]> {
  yield* iterMessages(statements, typePath, filePath);
  yield* iterEnums(statements, typePath, filePath);
}

function* iterMessages(
  statements: Statement[],
  typePath: string,
  filePath: string,
): Generator<[string, Message]> {
  const messageStatements = filterStatementsByType(statements, "message");
  for (const statement of messageStatements) {
    const messageTypePath = typePath + "." + statement.messageName.text;
    const message: Message = {
      filePath,
      options: getOptions(statement.messageBody.statements),
      description: getDescription(statement.leadingComments),
      fields: getMessageFields(statement.messageBody.statements),
      reservedFieldNumberRanges: [], // TODO
      reservedFieldNames: [], // TODO
      extensions: [], // TODO
    };
    yield [messageTypePath, message];
  }
}

function getMessageFields(statements: Statement[]): Message["fields"] {
  const fields: Message["fields"] = {};
  // TODO
  return fields;
}

function* iterEnums(
  statements: Statement[],
  typePath: string,
  filePath: string,
): Generator<[string, Enum]> {
  const enumStatements = filterStatementsByType(statements, "enum");
  for (const statement of enumStatements) {
    const enumTypePath = typePath + "." + statement.enumName.text;
    const _enum: Enum = {
      filePath,
      options: getOptions(statement.enumBody.statements),
      description: getDescription(statement.leadingComments),
      fields: getEnumFields(statement.enumBody.statements),
    };
    yield [enumTypePath, _enum];
  }
}

function getEnumFields(statements: Statement[]): Enum["fields"] {
  const fields: Enum["fields"] = {};
  const enumFieldStatements = filterStatementsByType(statements, "enum-field");
  for (const statement of enumFieldStatements) {
    const fieldNumber = evalSignedIntLit(statement.fieldNumber);
    fields[fieldNumber] = {
      description: getDescription(statement.leadingComments),
      name: statement.fieldName.text,
      options: getFieldOptions(statement.fieldOptions),
    };
  }
  return fields;
}

function getDescription(comments: ast.Comment[]): string {
  const docComment = comments.find((comment) => isDocComment(comment.text));
  return parseDocComment(docComment?.text ?? "");
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

function findStatementByType<TType extends Statement["type"]>(
  statements: Statement[],
  type: TType,
): Extract<Statement, { type: TType }> | undefined {
  return statements.find((statement) => statement.type === type) as any;
}

function filterStatementsByType<TType extends Statement["type"]>(
  statements: Statement[],
  type: TType,
): Extract<Statement, { type: TType }>[] {
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

function stringifyType(type: ast.Type): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitType(stringifier.visitor, type);
  return stringifier.finish();
}

function stringifyFullIdent(fullIdent: ast.FullIdent): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitFullIdent(stringifier.visitor, fullIdent);
  return stringifier.finish();
}

function stringifyOptionName(optionName: ast.OptionName): string {
  const stringifier = createNaiveAstStringifier();
  stringifier.visitor.visitOptionName(stringifier.visitor, optionName);
  return stringifier.finish();
}
