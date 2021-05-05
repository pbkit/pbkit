export function isDocComment(text: string): boolean {
  return text.startsWith("/**");
}

export function parseDocComment(text: string): string {
  const match = /\/\*\*[\s\S]*?\n([\s\S]+?)\n\s*\*\//.exec(text);
  if (!match) return "";
  const [, body] = match;
  const lines = body.split("\n").map((line) => line.replace(/\s*\*/, ""));
  const commonLeadingSpaceCount = Math.min(...lines.map(getLeadingSpaceCount));
  return lines.map((line) => line.slice(commonLeadingSpaceCount)).join("\n");
}

function getLeadingSpaceCount(line: string): number {
  let count = 0;
  for (const char of line) {
    if (char === " ") ++count;
    else break;
  }
  return count;
}
