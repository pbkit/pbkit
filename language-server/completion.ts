import * as lsp from "./lsp.ts";
import { CompletionItemKind } from "./lsp.ts";
import { ParseResult } from "../core/parser/proto.ts";
import { ColRow } from "../core/parser/recursive-descent-parser.ts";
import { Visitor, visitor as defaultVisitor } from "../core/visitor/index.ts";
import { scalarValueTypes } from "../core/runtime/scalar.ts";
import { getResolveTypePathFn } from "../core/schema/builder.ts";
import { Schema } from "../core/schema/model.ts";
import {
  stringifyFullIdent,
  stringifyType,
} from "../core/schema/stringify-ast-frag.ts";

export function getCompletionItems(
  schema: Schema,
  filePath: string,
  colRow: ColRow,
): lsp.CompletionItem[] {
  if (!schema.files[filePath]) return [];
  const { parseResult } = schema.files[filePath];
  if (!parseResult) return [];
  const offset = parseResult.parser.colRowToOffset(colRow);
  const scope = getScope(parseResult, offset);
  const type = getCompletionType(parseResult, offset);
  if (!type) return [];
  if (type === "fieldlabel") return fieldLabelCompletionItems;
  const completionItems = [
    ...scalarValueTypeCompletionItems,
    ...typesToCompletionItems(schema, filePath, scope),
  ];
  if (type === "fieldtype") return completionItems;
  return [...fieldLabelCompletionItems, ...completionItems];
}

function typesToCompletionItems(
  schema: Schema,
  filePath: string,
  scope: `.${string}`,
): lsp.CompletionItem[] {
  const resolveTypePathFn = getResolveTypePathFn(schema, filePath);
  const resolveTypePath = (type: string) => resolveTypePathFn(type, scope);
  return Object.entries(schema.types).map(([_typePath, type]) => {
    const typePath = _typePath as `.${string}`;
    const kind = (type.kind === "message")
      ? CompletionItemKind.Class
      : CompletionItemKind.Enum;
    const label = typePath.split(".").pop()!;
    const item: lsp.CompletionItem = { label, kind };
    return (
      tryCandidate(() => label) ||
      tryCandidate(() =>
        typePath.slice(getLongestCommonTypePath(typePath, scope).length + 1)
      ) ||
      tryCandidate(() => typePath.slice(1)) ||
      { ...item, insertText: typePath, detail: typePath }
    );
    function tryCandidate(get: () => string): lsp.CompletionItem | undefined {
      const candidate = get();
      if (resolveTypePath(candidate) !== typePath) return;
      return { ...item, insertText: candidate, detail: candidate };
    }
  });
}

const scalarValueTypeCompletionItems: lsp.CompletionItem[] = scalarValueTypes
  .map((label) => ({ label, kind: CompletionItemKind.Keyword }));

const fieldLabels = ["required", "optional", "repeated"];
const fieldLabelCompletionItems: lsp.CompletionItem[] = fieldLabels.map(
  (label) => ({ label, kind: CompletionItemKind.Keyword }),
);

type CompletionType = "fieldlabel-or-fieldtype" | "fieldlabel" | "fieldtype";
function getCompletionType(
  { ast }: ParseResult,
  offset: number,
): CompletionType | undefined {
  let result: CompletionType | undefined;
  const visitor: Visitor = {
    ...defaultVisitor,
    visitMalformedField(_visitor, node) {
      if (offset < node.start || offset > node.end + 1) return;
      result = "fieldlabel-or-fieldtype";
      if (node.fieldLabel) result = "fieldtype";
      const fieldTypeString = stringifyType(node.fieldType);
      const becomingAFieldLabel = fieldLabels.some(
        (fieldLabel) => fieldLabel.startsWith(fieldTypeString),
      );
      if (becomingAFieldLabel) result = "fieldlabel";
    },
  };
  visitor.visitProto(visitor, ast);
  return result;
}

function getLongestCommonTypePath(
  a: `.${string}`,
  b: `.${string}`,
): `.${string}` {
  const _a = a.slice(1).split(".");
  const _b = b.slice(1).split(".");
  const commonLength = Math.min(_a.length, _b.length);
  for (let i = 0; i < commonLength; ++i) {
    if (_a[i] !== _b[i]) return `.${_a.slice(0, i).join(".")}`;
  }
  return `.${_a.slice(0, commonLength).join(".")}`;
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
