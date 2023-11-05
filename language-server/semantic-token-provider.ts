import { Proto } from "../core/ast/index.ts";
import { ParseResult } from "../core/parser/proto.ts";
import { Span } from "../core/parser/recursive-descent-parser.ts";
import { Visitor, visitor as defaultVisitor } from "../core/visitor/index.ts";

export enum TokenType {
  enum = 0,
  function = 1,
  property = 2,
  keyword = 3,
  comment = 4,
  string = 5,
  number = 6,
  type = 7,
  variable = 8,
  parameter = 9,
  namespace = 10,
}
export enum TokenModifier {
  deprecated = 0,
  declaration = 1,
  definition = 2,
  readonly = 3,
}
export const tokenTypes = getKeysFromEnum(TokenType);
export const tokenModifiers = getKeysFromEnum(TokenModifier);

function getKeysFromEnum<T extends { [key: string]: any }>(e: T): (keyof T)[] {
  const numValues = Object.values(e).filter((value) =>
    typeof value === "number"
  ).map((v) => v.toString());
  return Object.keys(e).filter((v) => !numValues.includes(v)) as (keyof T)[];
}

export interface TokenPosition {
  line: number;
  startChar: number;
  length: number;
}
export interface DeltaPosition {
  deltaLine: number;
  deltaStartChar: number;
  length: number;
}
export interface TokenInformation {
  tokenType: TokenType;
  tokenModifiers: TokenModifier[];
}
export interface SemanticToken extends TokenPosition, TokenInformation {}
export interface DeltaSemanticToken extends DeltaPosition, TokenInformation {}

export function getSemanticTokens(
  { ast, parser, comments }: ParseResult<Proto>,
): SemanticToken[] {
  const tokens: SemanticToken[] = [];
  const visitor: Visitor = {
    ...defaultVisitor,
    visitImport(visitor, node) {
      node.weakOrPublic && push(node.weakOrPublic, TokenType.keyword);
      defaultVisitor.visitImport(visitor, node);
    },
    visitKeyword(visitor, node) {
      push(node, TokenType.keyword);
    },
    visitType(visitor, node) {
      const nameIdent = node.identOrDots.slice(-1)[0];
      if (nameIdent.start !== node.start) {
        push({ start: node.start, end: nameIdent.start }, TokenType.namespace);
      }
      push(nameIdent, TokenType.type);
    },
    visitRpc(visitor, node) {
      push(node.rpcName, TokenType.function);
      defaultVisitor.visitRpc(visitor, node);
    },
    visitMessage(visitor, node) {
      push(node.messageName, TokenType.type);
      defaultVisitor.visitMessage(visitor, node);
    },
    visitField(visitor, node) {
      push(node.fieldName, TokenType.property);
      defaultVisitor.visitField(visitor, node);
    },
    visitMalformedField(visitor, node) {
      node.fieldName && push(node.fieldName, TokenType.property);
      defaultVisitor.visitMalformedField(visitor, node);
    },
    visitOptionName(visitor, node) {
      push(node, TokenType.parameter);
    },
    visitEnum(visitor, node) {
      push(node.enumName, TokenType.enum);
      defaultVisitor.visitEnum(visitor, node);
    },
    visitEnumField(visitor, node) {
      push(node.fieldName, TokenType.property);
      defaultVisitor.visitEnumField(visitor, node);
    },
    visitMapField(visitor, node) {
      push(node.mapName, TokenType.property);
      defaultVisitor.visitMapField(visitor, node);
    },
    visitOneof(visitor, node) {
      push(node.oneofName, TokenType.property);
      defaultVisitor.visitOneof(visitor, node);
    },
    visitIdent(visitor, node) {
      push(node, TokenType.property);
    },
    visitIntLit(visitor, node) {
      push(node, TokenType.number, [TokenModifier.readonly]);
    },
    visitStrLit(visitor, node) {
      push(node, TokenType.string, [TokenModifier.readonly]);
    },
  };
  visitor.visitProto(visitor, ast);
  const commentTokens: SemanticToken[] = comments.map((comment) => {
    return {
      ...getTokenPosition(comment),
      tokenType: TokenType.comment,
      tokenModifiers: [],
    };
  });
  return [...tokens, ...commentTokens].sort((a, b) => {
    return a.line - b.line || a.startChar - b.startChar;
  });
  function getTokenPosition({ start, end }: Span): TokenPosition {
    const { row: line, col: startChar } = parser.offsetToColRow(start);
    const length = end - start;
    return { line, startChar, length };
  }
  function push(
    node: Span,
    tokenType: TokenType,
    tokenModifiers: TokenModifier[] = [],
  ) {
    tokens.push({ ...getTokenPosition(node), tokenType, tokenModifiers });
  }
}

export function toDeltaSemanticTokens(
  tokens: SemanticToken[],
): DeltaSemanticToken[] {
  let ln = 0, char = 0;
  return tokens.map((token) => {
    const deltaLine = token.line - ln;
    if (token.line !== ln) {
      ln = token.line;
      char = 0;
    }
    const deltaStartChar = token.startChar - char;
    char = token.startChar;
    return { ...token, deltaLine, deltaStartChar };
  });
}

export function toLspRepresentation(
  tokens: DeltaSemanticToken[],
): number[] {
  return tokens.reduce<number[]>((arr, token) => {
    const tokenModifierBit = token.tokenModifiers.reduce((bit, modifier) => {
      return bit | (2 << modifier);
    }, 0);
    return [
      ...arr,
      token.deltaLine,
      token.deltaStartChar,
      token.length,
      token.tokenType,
      tokenModifierBit,
    ];
  }, []);
}
