import * as ast from "../ast/index.ts";

import { Schema } from "./model.ts";
import { ColRow } from "../parser/recursive-descent-parser.ts";
import { ParseResult } from "../parser/proto.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { getResolveTypePathFn, ResolveTypePathFn } from "./builder.ts";
import { stringifyType } from "./stringify-ast-frag.ts";
import { Location, Range } from "../parser/location.ts";

export default function findAllReferences(
  schema: Schema,
  filePath: string,
  colRow: ColRow,
): Location[] {
  if (!schema.files[filePath]) return [];
  const { package: packageName, parseResult } = schema.files[filePath];
  if (!parseResult) return [];
  const offset = parseResult.parser.colRowToOffset(colRow);
  const resolveTypePath = getResolveTypePathFn(schema, filePath);
  const typePath = getTypePath(
    packageName,
    parseResult,
    offset,
    resolveTypePath,
  );
  if (!typePath) return [];
  const references = getTypeReferences(schema, typePath);
  const referenceNodeMap: Record<string, Range[]> = {};
  for (const refFilePath in references) {
    const targetTypePaths = references[refFilePath];
    referenceNodeMap[refFilePath] = findReferenceNodes(
      schema,
      refFilePath,
      typePath,
      targetTypePaths,
    );
  }
  return Object.entries(referenceNodeMap).flatMap((
    [filePath, referenceNodes],
  ) => {
    return referenceNodes.map((referenceNode) => ({
      filePath,
      start: referenceNode.start,
      end: referenceNode.end,
    }));
  });
}

function getTypePath(
  packageName: string,
  parseResult: ParseResult,
  offset: number,
  resolveTypePath: ResolveTypePathFn,
): string | undefined {
  let result: string | undefined;
  const stack: string[] = [packageName];
  const visitor: Visitor = {
    ...defaultVisitor,
    visitSyntax() {},
    visitImport() {},
    visitOption() {},
    visitEmpty() {},
    visitPackage() {},
    visitTopLevelDef(visitor, node) {
      if (offset < node.start) return;
      if (offset >= node.end) return;
      defaultVisitor.visitTopLevelDef(visitor, node);
    },
    visitMessage(visitor, node) {
      if (offset < node.start) return;
      if (offset >= node.end) return;
      stack.push(node.messageName.text);
      if (offset >= node.messageName.start && offset < node.messageName.end) {
        result = `.${stack.join(".")}`;
      }
      defaultVisitor.visitMessageBody(visitor, node.messageBody);
      stack.pop();
    },
    visitEnum(visitor, node) {
      if (offset < node.start) return;
      if (offset >= node.end) return;
      stack.push(node.enumName.text);
      if (offset >= node.enumName.start && offset < node.enumName.end) {
        result = `.${stack.join(".")}`;
      }
      stack.pop();
    },
    visitType(visitor, node) {
      if (offset < node.start) return;
      if (offset >= node.end) return;
      result = resolveTypePath(stringifyType(node), `.${stack.join(".")}`);
    },
  };
  visitor.visitProto(visitor, parseResult.ast);
  return result;
}

interface TypeReferences {
  [filePath: string]: string[];
}
function getTypeReferences(schema: Schema, typePath: string): TypeReferences {
  const references: TypeReferences = {};
  for (const [name, type] of Object.entries(schema.types)) {
    if (type.kind === "message") {
      for (const field of Object.values(type.fields)) {
        if (field.kind === "map") {
          if (field.valueTypePath === typePath) {
            references[type.filePath]
              ? references[type.filePath].push(name)
              : references[type.filePath] = [name];
          }
        } else {
          if (field.typePath === typePath) {
            references[type.filePath]
              ? references[type.filePath].push(name)
              : references[type.filePath] = [name];
          }
        }
      }
    }
  }
  return references;
}

function findReferenceNodes(
  schema: Schema,
  filePath: string,
  typePath: string,
  targetTypePaths: string[],
): Range[] {
  const file = schema.files[filePath];
  if (!file.parseResult) return [];
  const typeNodes: ast.Type[] = [];
  const stack: string[] = [file.package];
  const resolveTypePath = getResolveTypePathFn(schema, filePath);
  const visitor: Visitor = {
    ...defaultVisitor,
    visitSyntax() {},
    visitImport() {},
    visitOption() {},
    visitEmpty() {},
    visitPackage() {},
    visitMessage(visitor, node) {
      stack.push(node.messageName.text);
      defaultVisitor.visitMessageBody(visitor, node.messageBody);
      stack.pop();
    },
    visitEnum(visitor, node) {
      stack.push(node.enumName.text);
      defaultVisitor.visitEnumBody(visitor, node.enumBody);
      stack.pop();
    },
    visitType(visitor, node) {
      const scope = `.${stack.join(".")}` as const;
      if (targetTypePaths.includes(scope)) {
        if (resolveTypePath(stringifyType(node), scope) === typePath) {
          typeNodes.push(node);
        }
      }
    },
  };
  visitor.visitProto(visitor, file.parseResult.ast);
  return typeNodes.map((typeNode) => {
    const { start: startOffset, end: endOffset } = typeNode;
    if (!file.parseResult) throw new Error("parseResult cannot be undefined");
    const start = file.parseResult.parser.offsetToColRow(startOffset);
    const end = file.parseResult.parser.offsetToColRow(endOffset);
    return { start, end };
  });
}
