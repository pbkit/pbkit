import * as ast from "../ast/index.ts";
import { Loader } from "../loader/index.ts";
import { parse, ParseResult } from "../parser/proto.ts";
import {
  filterNodesByType,
  filterNodesByTypes,
  findNodeByType,
} from "./ast-util.ts";
import { isDocComment, parseDocComment } from "./doc-comment.ts";
import {
  evalConstant,
  evalIntLit,
  evalSignedIntLit,
  evalStrLit,
} from "./eval-ast-constant.ts";
import {
  Enum,
  File,
  Group,
  Import,
  Message,
  MessageField,
  Options,
  RpcType,
  Schema,
  Service,
  Type,
} from "./model.ts";
import {
  stringifyFullIdent,
  stringifyOptionName,
  stringifyType,
} from "./stringify-ast-frag.ts";

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
    const typePath = file.package ? "." + file.package : "";
    const statements = parseResult.ast.statements;
    const services = iterServices(statements, typePath, filePath);
    for (const [typePath, service] of services) {
      result.services[typePath] = service;
    }
    const types = iterTypes(statements, typePath, filePath);
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
  const queue = [...files];
  const done: { [filePath: string]: true } = {};
  while (queue.length) {
    const filePath = queue.pop()!;
    if (done[filePath]) continue;
    done[filePath] = true;
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
    queue.push(...file.imports.map(({ filePath }) => filePath));
  }
}

function getSyntax(statements: ast.Statement[]): File["syntax"] {
  const syntaxStatement = findNodeByType(statements, "syntax");
  const syntax = syntaxStatement?.syntax.text;
  return syntax === "proto3" ? "proto3" : "proto2";
}

function getPackage(statements: ast.Statement[]): string {
  const packageStatement = findNodeByType(statements, "package");
  if (!packageStatement) return "";
  return stringifyFullIdent(packageStatement.fullIdent);
}

function getImports(statements: ast.Statement[]): Import[] {
  const importStatements = filterNodesByType(statements, "import");
  return importStatements.map((statement) => {
    const kind = (statement.weakOrPublic?.text || "") as Import["kind"];
    const filePath = evalStrLit(statement.strLit);
    return {
      kind,
      filePath,
    };
  });
}

function getOptions(nodes?: ast.Node[]): Options {
  if (!nodes) return {};
  const optionStatements = filterNodesByTypes(nodes, [
    "option",
    "field-option",
  ]);
  const result: Options = {};
  for (const statement of optionStatements) {
    const optionName = stringifyOptionName(statement.optionName);
    const optionValue = evalConstant(statement.constant);
    result[optionName] = optionValue;
  }
  return result;
}

function* iterServices(
  statements: ast.Statement[],
  typePath: string,
  filePath: string,
): Generator<[string, Service]> {
  const serviceStatements = filterNodesByType(statements, "service");
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

function getRpcs(statements: ast.Statement[]): Service["rpcs"] {
  const rpcStatements = filterNodesByType(statements, "rpc");
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
  statements: ast.Statement[],
  typePath: string,
  filePath: string,
): Generator<[string, Type]> {
  for (const statement of statements) {
    if (statement.type === "enum") {
      yield getEnum(statement, typePath, filePath);
    } else if (statement.type === "message") {
      const message = getMessage(statement, typePath, filePath);
      yield message;
      const messageBodyStatement = statement.messageBody.statements;
      yield* iterTypes(messageBodyStatement, message[0], filePath);
    }
  }
}

function getMessage(
  statement: ast.Message,
  typePath: string,
  filePath: string,
): [string, Message] {
  const messageTypePath = typePath + "." + statement.messageName.text;
  const statements = statement.messageBody.statements;
  const message: Message = {
    kind: "message",
    filePath,
    description: getDescription(statement.leadingComments),
    ...getMessageBody(statements),
  };
  return [messageTypePath, message];
}

type MessageBody = Omit<Message, "kind" | "filePath" | "description">;
function getMessageBody(
  statements: ast.Statement[],
): MessageBody {
  const fields: Message["fields"] = {};
  for (const [fieldNumber, field] of iterMessageFields(statements)) {
    fields[fieldNumber] = field;
  }
  const groups: Message["groups"] = {};
  for (const groupStatement of filterNodesByType(statements, "group")) {
    const groupName = groupStatement.groupName.text;
    groups[groupName] = getGroup(groupStatement);
  }
  return {
    options: getOptions(statements),
    fields,
    groups,
    reservedFieldNumberRanges: [], // TODO
    reservedFieldNames: [], // TODO
    extensions: [], // TODO
  };
}

function* iterMessageFields(
  statements: ast.Statement[],
): Generator<[number, MessageField]> {
  for (const statement of statements) {
    if (statement.type === "field") {
      const fieldNumber = evalIntLit(statement.fieldNumber);
      const fieldBase = {
        description: getDescription(statement.leadingComments),
        name: statement.fieldName.text,
        options: getOptions(statement.fieldOptions?.fieldOptionOrCommas),
        type: stringifyType(statement.fieldType),
      };
      if (!statement.fieldLabel) {
        yield [fieldNumber, { kind: "normal", ...fieldBase }];
      } else {
        const kind = statement.fieldLabel.text;
        if (
          kind === "required" ||
          kind === "optional" ||
          kind === "repeated"
        ) {
          yield [fieldNumber, { kind, ...fieldBase }];
        }
      }
    } else if (statement.type === "oneof") {
      yield* iterOneofFields(
        statement.oneofBody.statements,
        statement.oneofName.text,
      );
    } else if (statement.type === "map-field") {
      yield [evalIntLit(statement.fieldNumber), {
        kind: "map",
        description: getDescription(statement.leadingComments),
        name: statement.mapName.text,
        options: getOptions(statement.fieldOptions?.fieldOptionOrCommas),
        keyType: stringifyType(statement.keyType),
        valueType: stringifyType(statement.valueType),
      }];
    }
  }
}

function* iterOneofFields(
  statements: ast.OneofBodyStatement[],
  oneof: string,
): Generator<[number, MessageField]> {
  const oneofStatements = filterNodesByType(statements, "oneof-field");
  for (const statement of oneofStatements) {
    const fieldNumber = evalIntLit(statement.fieldNumber);
    yield [fieldNumber, {
      kind: "oneof",
      description: getDescription(statement.leadingComments),
      name: statement.fieldName.text,
      options: getOptions(statement.fieldOptions?.fieldOptionOrCommas),
      type: stringifyType(statement.fieldType),
      oneof,
    }];
  }
}

function getGroup(statement: ast.Group): Group {
  const statements = statement.messageBody.statements;
  const fields: Message["fields"] = {};
  for (const [fieldNumber, field] of iterMessageFields(statements)) {
    fields[fieldNumber] = field;
  }
  return {
    kind: statement.groupLabel.text as Group["kind"],
    description: getDescription(statement.leadingComments),
    fieldNumber: evalIntLit(statement.fieldNumber),
    ...getMessageBody(statements),
  };
}

function getEnum(
  statement: ast.Enum,
  typePath: string,
  filePath: string,
): [string, Enum] {
  const enumTypePath = typePath + "." + statement.enumName.text;
  const _enum: Enum = {
    kind: "enum",
    filePath,
    options: getOptions(statement.enumBody.statements),
    description: getDescription(statement.leadingComments),
    fields: getEnumFields(statement.enumBody.statements),
  };
  return [enumTypePath, _enum];
}

function getEnumFields(statements: ast.Statement[]): Enum["fields"] {
  const fields: Enum["fields"] = {};
  const enumFieldStatements = filterNodesByType(statements, "enum-field");
  for (const statement of enumFieldStatements) {
    const fieldNumber = evalSignedIntLit(statement.fieldNumber);
    fields[fieldNumber] = {
      description: getDescription(statement.leadingComments),
      name: statement.fieldName.text,
      options: getOptions(statement.fieldOptions?.fieldOptionOrCommas),
    };
  }
  return fields;
}

function getDescription(comments: ast.Comment[]): string {
  const docComment = comments.find((comment) => isDocComment(comment.text));
  return parseDocComment(docComment?.text ?? "");
}
