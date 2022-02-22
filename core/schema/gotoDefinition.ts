import * as ast from "../ast/index.ts";

import { ParseResult } from "../parser/proto.ts";
import { ColRow, Token } from "../parser/recursive-descent-parser.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { getResolveTypePathFn } from "./builder.ts";
import { Schema, Type } from "./model.ts";
import { stringifyFullIdent, stringifyType } from "./stringify-ast-frag.ts";
import { Location } from "../parser/location.ts";

export default function gotoDefinition(
  schema: Schema,
  filePath: string,
  colRow: ColRow,
): Location | undefined {
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
    visitPackage(visitor, node) {
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
    visitType(visitor, node) {
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
    visitPackage(visitor, node) {
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
