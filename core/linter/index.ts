import { parse, ParseResult } from "../parser/proto.ts";

export interface LintConfig {
  text: string;
  parseResult?: ParseResult; // If not provided, it is derived from the given text.
  filePath?: string;
  rules: LintRule[];
}
export interface LintResult {
  warnings: LintResultItem[];
  errors: LintResultItem[];
}
export function lint({
  text,
  parseResult,
  filePath,
  rules,
}: LintConfig): LintResult {
  const context: LintContext = {
    text,
    parseResult: parseResult || parse(text),
    filePath,
  };
  const warnings: LintResultItem[][] = [];
  const errors: LintResultItem[][] = [];
  for (const rule of rules) {
    const result = rule.lint(context);
    warnings.push(result.warnings);
    errors.push(result.errors);
  }
  return {
    warnings: warnings.flat(1),
    errors: errors.flat(1),
  };
}

export interface LintRule {
  name: string;
  lint(context: LintContext): LintResult;
}

export interface LintContext {
  text: string;
  parseResult: ParseResult;
  filePath?: string;
}

export interface LintResultItem {
  rule: LintRule;
  message?: string;
  fix?: () => TextEdit[];
}

export interface TextEdit {
  start: number;
  end: number;
  newText: string;
}
