import { Proto } from "../ast/index.ts";
import { ParseResult } from "../parser/proto.ts";
import { Span } from "../parser/recursive-descent-parser.ts";
import {
  Visitor,
  visitor as defaultVisitor,
  visitStatementBase,
} from "../visitor/index.ts";

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

interface TokenPosition {
  line: number;
  startChar: number;
  length: number;
}
interface DeltaPosition {
  deltaLine: number;
  deltaStartChar: number;
  length: number;
}
interface TokenInformation {
  tokenType: TokenType;
  tokenModifiers: TokenModifier[];
}
interface SemanticToken extends TokenPosition, TokenInformation {}
interface DeltaSemanticToken extends DeltaPosition, TokenInformation {}

export function getSemanticTokens(
  { ast, parser, comments }: ParseResult<Proto>,
): SemanticToken[] {
  const tokens: SemanticToken[] = [];
  const visitor: Visitor = {
    ...defaultVisitor,
    visitKeyword(visitor, node) {
      tokens.push({
        ...getTokenPosition(node),
        tokenType: TokenType.keyword,
        tokenModifiers: [],
      });
    },
    visitType(visitor, node) {
      tokens.push({
        ...getTokenPosition(node),
        tokenType: TokenType.type,
        tokenModifiers: [],
      });
    },
    visitMessage(visitor, node) {
      visitStatementBase(visitor, node, () => {
        visitor.visitKeyword(visitor, node.keyword);
        tokens.push({
          ...getTokenPosition(node.messageName),
          tokenType: TokenType.type,
          tokenModifiers: [],
        });
        visitor.visitMessageBody(visitor, node.messageBody);
      });
    },
    visitField(visitor, node) {
      visitStatementBase(visitor, node, () => {
        node.fieldLabel && visitor.visitKeyword(visitor, node.fieldLabel);
        visitor.visitType(visitor, node.fieldType);
        tokens.push({
          ...getTokenPosition(node.fieldName),
          tokenType: TokenType.property,
          tokenModifiers: [],
        });
        visitor.visitIntLit(visitor, node.fieldNumber);
        node.fieldOptions &&
          visitor.visitFieldOptions(visitor, node.fieldOptions);
      });
    },
    visitFieldOption(visitor, node) {
      tokens.push({
        ...getTokenPosition(node.optionName),
        tokenType: TokenType.parameter,
        tokenModifiers: [],
      });
      tokens.push({
        ...getTokenPosition(node.constant),
        tokenType: TokenType.variable,
        tokenModifiers: [TokenModifier.readonly],
      });
    },
    visitIdent(visitor, node) {
      tokens.push({
        ...getTokenPosition(node),
        tokenType: TokenType.property,
        tokenModifiers: [],
      });
    },
    visitIntLit(visitor, node) {
      tokens.push({
        ...getTokenPosition(node),
        tokenType: TokenType.number,
        tokenModifiers: [],
      });
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
