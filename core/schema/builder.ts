import * as ast from "../ast/index.ts";
import { Loader } from "../loader/index.ts";
import { parse, ParseResult } from "../parser/proto.ts";
import { toPojoSet } from "../runtime/array.ts";
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
import { scalarValueTypes } from "../runtime/scalar.ts";
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
  const absoluteFilePathMapping: AbsoluteFilePathMapping = {};
  const iterFileResults = iterFiles(
    config.files,
    config.loader,
    absoluteFilePathMapping,
  );
  for await (const { filePath, parseResult, file } of iterFileResults) {
    result.files[filePath] = file;
    const typePath = file.package ? "." + file.package : "";
    const statements = parseResult.ast.statements;
    const services = iterServices(statements, typePath, filePath);
    for (const [typePath, service] of services) {
      file.servicePaths.push(typePath);
      if (!(typePath in result.services)) result.services[typePath] = service;
    }
    const types = iterTypes(statements, typePath, filePath);
    for (const [typePath, type] of types) {
      file.typePaths.push(typePath);
      if (!(typePath in result.types)) result.types[typePath] = type;
    }
    // TODO: extends
  }
  // resolve imports
  for (const file of Object.values(result.files)) {
    for (const entry of file.imports) {
      if (entry.importPath in absoluteFilePathMapping) {
        entry.filePath = absoluteFilePathMapping[entry.importPath];
      }
    }
  }
  // resolve types
  for (const [filePath, file] of Object.entries(result.files)) {
    const resolveTypePath = getResolveTypePathFn(result, filePath);
    for (const typePath of file.typePaths) {
      const type = result.types[typePath];
      if (type.kind === "enum") continue;
      for (const field of Object.values(type.fields)) {
        if (field.kind === "map") {
          const fieldKeyTypePath = resolveTypePath(
            field.keyType,
            typePath as `.${string}`,
          );
          const fieldValueTypePath = resolveTypePath(
            field.valueType,
            typePath as `.${string}`,
          );
          if (fieldKeyTypePath) field.keyTypePath = fieldKeyTypePath;
          if (fieldValueTypePath) field.valueTypePath = fieldValueTypePath;
        } else {
          const fieldTypePath = resolveTypePath(
            field.type,
            typePath as `.${string}`,
          );
          if (fieldTypePath) field.typePath = fieldTypePath;
        }
      }
    }
    for (const servicePath of file.servicePaths) {
      const service = result.services[servicePath];
      for (const rpc of Object.values(service.rpcs)) {
        const reqTypePath = resolveTypePath(
          rpc.reqType.type,
          servicePath as `.${string}`,
        );
        const resTypePath = resolveTypePath(
          rpc.resType.type,
          servicePath as `.${string}`,
        );
        if (reqTypePath) rpc.reqType.typePath = reqTypePath;
        if (resTypePath) rpc.resType.typePath = resTypePath;
      }
    }
  }
  return result;
}

interface AbsoluteFilePathMapping {
  [filePath: string]: string;
}

interface IterFileResult {
  filePath: string;
  parseResult: ParseResult;
  file: File;
}
async function* iterFiles(
  files: string[],
  loader: Loader,
  absoluteFilePathMapping: AbsoluteFilePathMapping,
): AsyncGenerator<IterFileResult> {
  const queue = [...files];
  const visited: { [filePath: string]: true } = {};
  const loaded: { [filePath: string]: true } = {};
  while (queue.length) {
    const filePath = queue.pop()!;
    if (visited[filePath]) continue;
    visited[filePath] = true;
    const loadResult = await loader.load(filePath);
    if (!loadResult) continue;
    absoluteFilePathMapping[filePath] = loadResult.absolutePath;
    if (loaded[loadResult.absolutePath]) continue;
    loaded[loadResult.absolutePath] = true;
    const parseResult = parse(loadResult.data);
    const statements = parseResult.ast.statements;
    const file: File = {
      parseResult,
      syntax: getSyntax(statements),
      package: getPackage(statements),
      imports: getImports(statements),
      options: getOptions(statements),
      typePaths: [],
      servicePaths: [],
    };
    yield { filePath: loadResult.absolutePath, parseResult, file };
    queue.push(...file.imports.map(({ importPath }) => importPath));
  }
}

function getSyntax(statements: ast.Statement[]): File["syntax"] {
  const syntaxStatement = findNodeByType(statements, "syntax" as const);
  const syntax = syntaxStatement?.syntax.text;
  return syntax === "proto3" ? "proto3" : "proto2";
}

function getPackage(statements: ast.Statement[]): string {
  const packageStatement = findNodeByType(statements, "package" as const);
  if (!packageStatement) return "";
  return stringifyFullIdent(packageStatement.fullIdent);
}

function getImports(statements: ast.Statement[]): Import[] {
  const importStatements = filterNodesByType(statements, "import" as const);
  return importStatements.map((statement) => {
    const kind = (statement.weakOrPublic?.text || "") as Import["kind"];
    const importPath = evalStrLit(statement.strLit);
    return {
      kind,
      importPath,
    };
  });
}

function getOptions(nodes?: ast.Node[]): Options {
  if (!nodes) return {};
  const optionStatements = filterNodesByTypes(nodes, [
    "option" as const,
    "field-option" as const,
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
  const serviceStatements = filterNodesByType(statements, "service" as const);
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
  const rpcStatements = filterNodesByType(statements, "rpc" as const);
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
  for (
    const groupStatement of filterNodesByType(statements, "group" as const)
  ) {
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
  const oneofStatements = filterNodesByType(statements, "oneof-field" as const);
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
  const enumFieldStatements = filterNodesByType(
    statements,
    "enum-field" as const,
  );
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

function getDescription(commentGroups: ast.CommentGroup[]): string {
  const comments = commentGroups.flatMap(
    (commentGroup) => commentGroup.comments,
  );
  const docComment = comments.find((comment) => isDocComment(comment.text));
  return parseDocComment(docComment?.text ?? "");
}

export type ResolveTypePathFn = (
  type: string,
  scope: `.${string}`,
) => string | undefined;
export function getResolveTypePathFn(
  schema: Schema,
  filePath: string,
): ResolveTypePathFn {
  const visibleTypePaths = toPojoSet(getVisibleTypePaths(schema, filePath));
  return function resolveTypePath(type, scope) {
    if (type in scalarValueTypeSet) return "." + type;
    if (type.startsWith(".")) return visibleTypePaths[type];
    let currentScope = scope;
    while (true) {
      const typePath = currentScope + "." + type;
      if (typePath in visibleTypePaths) return typePath;
      const cut = currentScope.lastIndexOf(".");
      if (cut < 0) return undefined;
      currentScope = currentScope.slice(0, cut) as `.${string}`;
    }
  };
}
const scalarValueTypeSet = toPojoSet(scalarValueTypes);

function getVisibleTypePaths(schema: Schema, filePath: string): string[] {
  const file = schema.files[filePath];
  if (!file) return [];
  return [
    ...file.typePaths,
    ...file.imports.map((entry) =>
      entry.filePath ? getExportedTypePaths(schema, entry.filePath) : []
    ).flat(1),
  ];
}

function getExportedTypePaths(schema: Schema, filePath: string): string[] {
  const result: string[] = [];
  const done: { [filePath: string]: true } = {};
  const queue = [filePath];
  while (queue.length) {
    const filePath = queue.pop()!;
    if (done[filePath]) continue;
    done[filePath] = true;
    const file = schema.files[filePath];
    if (!file) continue;
    result.push(...file.typePaths);
    for (const entry of file.imports) {
      if (entry.kind !== "public") continue;
      if (!entry.filePath) continue;
      queue.push(entry.filePath);
    }
  }
  return result;
}
