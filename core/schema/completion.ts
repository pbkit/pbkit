import * as lsp from "../../language-server/lsp.ts";
import { CompletionItemKind } from "../../language-server/lsp.ts";
import { ParseResult } from "../parser/proto.ts";
import { ColRow } from "../parser/recursive-descent-parser.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { getResolveTypePathFn } from "./builder.ts";
import { getTypeDocs } from "./gotoDefinition.ts";
import { Schema } from "./model.ts";
import { stringifyFullIdent } from "./stringify-ast-frag.ts";

export enum CompletionType {
  Uninitialized = 0,
  FieldLabel = 1,
  FieldeType = 2,
  FieldName = 3,
}

export function getCompletionItems(
  schema: Schema,
  filePath: string,
  colRow: ColRow,
): lsp.CompletionItem[] {
  if (!schema.files[filePath]) return [];
  const { parseResult, package: packageName } = schema.files[filePath];
  if (!parseResult) return [];
  const offset = parseResult.parser.colRowToOffset(colRow);
  const scope = getScope(parseResult, offset);
  const resolveTypePathFn = getResolveTypePathFn(schema, filePath);
  const resolveTypePath = (type: string) => resolveTypePathFn(type, scope);
  const type = getCompletionType(parseResult, offset);
  if (type === CompletionType.Uninitialized) return [];
  switch (type) {
    case CompletionType.FieldName: {
      return Object.entries(schema.types).map(([type, value]) => {
        const documentation: lsp.MarkupContent = {
          kind: "markdown",
          value: getTypeDocs(value, type),
        };
        const kind = value.kind === "message"
          ? CompletionItemKind.Interface
          : CompletionItemKind.Enum;
        const label = type.split(".").pop()!;
        const item: lsp.CompletionItem = {
          label,
          kind,
          documentation,
        };
        if (value.filePath === filePath) {
          // simplified specifier
          const typeName = type.split(".").pop()!;
          // typePath without packageName and leading dot for path
          const typePath = type.slice(packageName.length + 2);
          // if simplified specifier can be used, use it.
          if (resolveTypePath(typeName) === type) {
            return {
              ...item,
              insertText: typeName,
              detail: typeName,
            };
          }
          // if simplified specifer and typePath (without packageName) are equal,
          // you have to use the full specifier because the simplifed specifier is not unique (shadowed).
          if (typePath === typeName) {
            return {
              ...item,
              insertText: type.slice(1),
              detail: type.slice(1),
            };
          }
          // if simplified specifier is subtype of typePath, slice the common path.
          if (type.startsWith(scope)) {
            return {
              ...item,
              insertText: type.slice(scope.length + 1),
              detail: type.slice(scope.length + 1),
            };
          }
          return {
            ...item,
            insertText: typePath,
            detail: typePath,
          };
        }
        const typePath = resolveTypePath(type);
        if (typePath) {
          return {
            ...item,
            insertText: typePath.slice(1),
            detail: typePath.slice(1),
          };
        }
        return {
          ...item,
          insertText: type.slice(1),
          detail: type.slice(1),
        };
      });
    }
  }
  return [];
}

function getCompletionType(
  { ast }: ParseResult,
  offset: number,
): CompletionType {
  let result: CompletionType = CompletionType.Uninitialized;
  const visitor: Visitor = {
    ...defaultVisitor,
    visitMalformedField(_visitor, node) {
      if (offset < node.start || offset > node.end + 1) return;
      result = CompletionType.FieldName;
    },
  };
  visitor.visitProto(visitor, ast);
  return result;
}

type Scope = `.${string}`;
function getScope({ ast }: ParseResult, offset: number): Scope {
  const stack: string[] = [];
  const visitor: Visitor = {
    ...defaultVisitor,
    visitPackage(_visitor, node) {
      stack.push(stringifyFullIdent(node.fullIdent));
    },
    visitMessage(visitor, node) {
      if (offset < node.start) return;
      if (offset > node.end) return;
      stack.push(node.messageName.text);
      defaultVisitor.visitMessage(visitor, node);
    },
  };
  visitor.visitProto(visitor, ast);
  return `.${stack.join(".")}`;
}
