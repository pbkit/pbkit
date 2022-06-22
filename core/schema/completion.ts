import * as lsp from "../../language-server/lsp.ts";
import { ParseResult } from "../parser/proto.ts";
import { ColRow } from "../parser/recursive-descent-parser.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { Schema } from "./model.ts";

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
  const { parseResult } = schema.files[filePath];
  if (!parseResult) return [];
  const offset = parseResult.parser.colRowToOffset(colRow);
  const type = getCompletionType(parseResult, offset);
  if (type === CompletionType.Uninitialized) return [];
  switch (type) {
    case CompletionType.FieldName: {
      return Object.keys(schema.types).map((type) => {
        const label = type.split(".").pop()!;
        return { label };
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
    visitMalformedField(visitor, node) {
      console.error({ type: "malformed-field", node, offset });
      if (offset < node.start || offset > node.end + 1) return;
      result = CompletionType.FieldName;
    },
  };
  visitor.visitProto(visitor, ast);
  return result;
}
