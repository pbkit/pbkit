export function unwrap(text: string): string {
  // "//"
  if (isSinglelineComment(text)) return unwrapSinglelineComment(text);
  // "/**"
  if (isDocComment(text)) return unwrapDocComment(text);
  // "/*"
  if (isMultilineComment(text)) return unwrapMultilineComment(text);
  return text;
}

export function unwrapSinglelineComment(text: string): string {
  return text.replace(/^\/\/+\s?/, "").replace(/\r?\n$/, "");
}

export function unwrapMultilineComment(text: string): string {
  if (!text.startsWith("/*") || !(text.endsWith("*/"))) return text;
  const body = text.slice(2, -2).replace(/^[ \t\r]*\n|\n[ \t\r]*$/g, "");
  const lines = body.split("\n");
  return removeCommonLeadingSpaces(lines).join("\n");
}

export function unwrapDocComment(text: string): string {
  const match = /\/\*\*[\s\S]*?\n([\s\S]+?)\n\s*\*\//.exec(text);
  if (!match) return text;
  const [, body] = match;
  const lines = body.split("\n").map((line) => line.replace(/\s*\*/, ""));
  return removeCommonLeadingSpaces(lines).join("\n");
}

export function isSinglelineComment(text: string): boolean {
  return text.startsWith("//");
}

export function isMultilineComment(text: string): boolean {
  return text.startsWith("/*");
}

export function isDocComment(text: string): boolean {
  return text.startsWith("/**");
}

function removeCommonLeadingSpaces(lines: string[]): string[] {
  const commonLeadingSpaceCount = Math.min(...lines.map(getLeadingSpaceCount));
  return lines.map((line) => line.slice(commonLeadingSpaceCount));
}

function getLeadingSpaceCount(line: string): number {
  let count = 0;
  for (const char of line) {
    if (char === " ") ++count;
    else break;
  }
  return count;
}
