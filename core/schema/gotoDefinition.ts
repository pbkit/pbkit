import * as ast from "../ast/index.ts";
import { ParseResult } from "../parser/proto.ts";
import { ColRow, Token } from "../parser/recursive-descent-parser.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { getResolveTypePathFn } from "./builder.ts";
import { File, Schema, Type } from "./model.ts";
import { stringifyFullIdent, stringifyType } from "./stringify-ast-frag.ts";
import { Location } from "../parser/location.ts";
import { filterNodesByType } from "./ast-util.ts";
import { evalStrLit } from "./eval-ast-constant.ts";

export default function gotoDefinition(
  schema: Schema,
  filePath: string,
  colRow: ColRow,
): Location | undefined {
  if (!schema.files[filePath]) return;
  const file = schema.files[filePath] as GotoDefinitionContext["file"];
  const { parseResult } = file;
  if (!parseResult) return;
  const offset = parseResult.parser.colRowToOffset(colRow);
  const context: GotoDefinitionContext = { schema, filePath, offset, file };
  return handleImportStatements(context) || handleTypeReferences(context);
}

interface GotoDefinitionContext {
  schema: Schema;
  filePath: string;
  offset: number;
  file: File & { parseResult: ParseResult };
}

function handleImportStatements(
  { file, offset }: GotoDefinitionContext,
): Location | undefined {
  const importStatements = filterNodesByType(
    file.parseResult.ast.statements,
    "import",
  );
  for (const importStatement of importStatements) {
    const { strLit } = importStatement;
    if (offset < strLit.start) continue;
    if (offset >= strLit.end) continue;
    const importPath = evalStrLit(strLit);
    const i = file.imports.find((i) => i.importPath === importPath);
    if (!i?.filePath) return;
    return {
      filePath: i.filePath,
      start: { col: 0, row: 0 },
      end: { col: 0, row: 0 },
    };
  }
}

function handleTypeReferences(
  { schema, filePath, offset, file }: GotoDefinitionContext,
): Location | undefined {
  const typeReference = getTypeReference(file.parseResult, offset);
  if (!typeReference) return;
  const typePath = getResolveTypePathFn(schema, filePath)(
    stringifyType(typeReference.node),
    typeReference.scope,
  );
  if (!typePath) return;
  const type = schema.types[typePath];
  if (!type) return;
  const parser = schema.files[type.filePath]?.parseResult?.parser;
  if (!parser) return;
  const typeDefinition = getTypeDefinition(schema, typePath);
  if (!typeDefinition) return;
  const { start, end } = getNameToken(typeDefinition);
  return {
    filePath: type.filePath,
    start: parser.offsetToColRow(start),
    end: parser.offsetToColRow(end),
  };
}

export function getTypeInformation(
  schema: Schema,
  filePath: string,
  colRow: ColRow,
) {
  if (!schema.files[filePath]) return;
  const { parseResult } = schema.files[filePath];
  if (!parseResult) return;
  const offset = parseResult.parser.colRowToOffset(colRow);
  const typeReference = getTypeReference(parseResult, offset);
  if (!typeReference) return;
  const typePath = getResolveTypePathFn(schema, filePath)(
    stringifyType(typeReference.node),
    typeReference.scope,
  );
  if (!typePath) return;
  const type = schema.types[typePath];
  if (!type) return;
  const fields = getFields(type);
  return [
    "```proto",
    `${type.kind} ${typePath.split(".").pop()} {`,
    ...fields.map((field) => "  " + field),
    "}",
    "```",
  ].join(
    "\n",
  );
  function getFields(type: Type) {
    switch (type.kind) {
      case "message":
        return Object.entries(type.fields).sort((a, b) =>
          parseInt(a[0]) - parseInt(b[0])
        ).map(([fieldNumber, value]) => {
          if (value.kind === "map") {
            return `map<${value.keyType}, ${value.valueType}> ${fieldNumber} = ${fieldNumber};`;
          }
          return `${
            value.typePath ? value.typePath.slice(1) : ""
          } ${value.name} = ${fieldNumber};`;
        });
      case "enum":
        return Object.entries(type.fields).sort((a, b) =>
          parseInt(a[0]) - parseInt(b[0])
        ).map(([fieldNumber, value]) => {
          return `${value.name} = ${fieldNumber};`;
        });
    }
  }
}

interface TypeReference {
  node: ast.Type;
  scope: `.${string}`;
}
function getTypeReference(
  parseResult: ParseResult,
  offset: number,
): TypeReference | undefined {
  let result: TypeReference | undefined;
  const stack: string[] = [];
  const visitor: Visitor = {
    ...defaultVisitor,
    visitSyntax() {},
    visitImport() {},
    visitOption() {},
    visitEmpty() {},
    visitPackage(_visitor, node) {
      stack.push(stringifyFullIdent(node.fullIdent));
    },
    visitTopLevelDef(visitor, node) {
      if (offset < node.start) return;
      if (offset >= node.end) return;
      return defaultVisitor.visitTopLevelDef(visitor, node);
    },
    visitMessage(visitor, node) {
      stack.push(node.messageName.text);
      defaultVisitor.visitMessage(visitor, node);
      stack.pop();
    },
    visitType(_visitor, node) {
      if (offset < node.start) return;
      if (offset >= node.end) return;
      result = { node, scope: `.${stack.join(".")}` };
    },
  };
  visitor.visitProto(visitor, parseResult.ast);
  return result;
}

function getTypeDefinition(
  schema: Schema,
  typePath: string,
): ast.Message | ast.Enum | undefined {
  let result: ast.Message | ast.Enum | undefined;
  const stack: string[] = [];
  const type = schema.types[typePath];
  if (!type) return;
  const parseResult = schema.files[type.filePath]?.parseResult;
  if (!parseResult) return;
  const visitor: Visitor = {
    ...defaultVisitor,
    visitSyntax() {},
    visitImport() {},
    visitPackage(_visitor, node) {
      stack.push(stringifyFullIdent(node.fullIdent));
    },
    visitOption() {},
    visitEmpty() {},
    visitMessage(visitor, node) {
      stack.push(node.messageName.text);
      setResult(node);
      defaultVisitor.visitMessage(visitor, node);
      stack.pop();
    },
    visitEnum(visitor, node) {
      stack.push(node.enumName.text);
      setResult(node);
      defaultVisitor.visitEnum(visitor, node);
      stack.pop();
    },
  };
  visitor.visitProto(visitor, parseResult.ast);
  return result;
  function setResult(node: ast.Message | ast.Enum) {
    if (`.${stack.join(".")}` === typePath) result = node;
  }
}

function getNameToken(node: ast.Message | ast.Enum): Token {
  switch (node.type) {
    case "message":
      return node.messageName;
    case "enum":
      return node.enumName;
  }
}
