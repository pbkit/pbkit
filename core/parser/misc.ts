import {
  Pattern,
  RecursiveDescentParser,
  Span,
  Token,
} from "./recursive-descent-parser.ts";

export interface AcceptFn<T> {
  (parser: RecursiveDescentParser): T | undefined;
}

export function many<T>(
  parser: RecursiveDescentParser,
  acceptFn: AcceptFn<T>,
): T[] {
  const nodes: T[] = [];
  let node: T | undefined;
  while (node = acceptFn(parser)) nodes.push(node);
  return nodes;
}

export function flipFlop<T, U>(
  parser: RecursiveDescentParser,
  flipFn: AcceptFn<T>,
  flopFn: AcceptFn<U>,
  skipWsFn?: AcceptFn<void>,
): (T | U)[] {
  let flip = true;
  const fn: AcceptFn<T | U> = (parser) => {
    const result = flip ? flipFn(parser) : flopFn(parser);
    flip = !flip;
    skipWsFn?.(parser);
    return result;
  };
  const nodes: (T | U)[] = [];
  let node: T | U | undefined;
  if (node = fn(parser)) nodes.push(node);
  while (node = fn(parser)) nodes.push(node);
  return nodes;
}

export function choice<T>(acceptFns: AcceptFn<T>[]): AcceptFn<T> {
  return function accept(parser) {
    for (const acceptFn of acceptFns) {
      const node = acceptFn(parser);
      if (node) return node;
    }
  };
}

export function mergeSpans(
  spans: (undefined | Span | (undefined | Span)[])[],
): Span {
  let start = Infinity;
  let end = -Infinity;
  for (let i = 0; i < spans.length; ++i) {
    if (spans[i] == null) continue;
    const span = Array.isArray(spans[i])
      ? mergeSpans(spans[i] as Span[])
      : spans[i] as Span;
    start = Math.min(start, span.start);
    end = Math.max(end, span.end);
  }
  return { start, end };
}

const identPattern = /^[a-z_][a-z0-9_]*/i;

export function acceptSpecialToken<TType extends string>(
  parser: RecursiveDescentParser,
  type: TType,
  pattern: Pattern = identPattern,
): (Token & { type: TType }) | undefined {
  const token = parser.accept(pattern);
  if (!token) return;
  return { type, ...token };
}

export function acceptPatternAndThen<T>(
  pattern: Pattern,
  then: (token: Token) => T,
): AcceptFn<T> {
  return function accept(parser) {
    const token = parser.accept(pattern);
    if (!token) return;
    return then(token);
  };
}
