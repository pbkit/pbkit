import * as ast from "../ast/index.ts";
import { stringifyFullIdent } from "./stringify-ast-frag.ts";

export function evalConstant(
  constant: ast.Constant,
): boolean | number | string {
  switch (constant.type) {
    case "aggregate":
      return "";
    case "bool-lit":
      return evalBoolLit(constant.text);
    case "full-ident":
      return stringifyFullIdent(constant);
    case "signed-float-lit":
      return evalSignedFloatLit(constant);
    case "signed-int-lit":
      return evalSignedIntLit(constant);
    case "str-lit":
      return evalStrLit(constant);
  }
}

export function evalBoolLit(text: string): boolean {
  if (text === "true") return true;
  return false;
}

export function evalIntLit(intLit: ast.IntLit): number {
  const text = intLit.text;
  if (text.startsWith("0x")) return parseInt(text, 16);
  if (text.startsWith("0")) return parseInt(text, 8);
  return parseInt(text, 10);
}

export function evalSignedIntLit(signedIntLit: ast.SignedIntLit): number {
  const intLit = signedIntLit.value;
  if (signedIntLit.sign?.text === "-") return -evalIntLit(intLit);
  return evalIntLit(intLit);
}

export function evalFloatLit(floatLit: ast.FloatLit): number {
  const text = floatLit.text;
  if (text === "inf") return Infinity;
  if (text === "nan") return NaN;
  return parseFloat(text);
}

export function evalSignedFloatLit(signedFloatLit: ast.SignedFloatLit): number {
  const floatLit = signedFloatLit.value;
  if (signedFloatLit.sign?.text === "-") return -evalFloatLit(floatLit);
  return evalFloatLit(floatLit);
}

export function evalStrLit(strLit: ast.StrLit): string {
  return strLit.tokens.map((token) => evalStrLitFragment(token.text)).join("");
}

function evalStrLitFragment(text: string): string {
  return text
    .slice(1, -1)
    .replace(
      /(?:\\x([0-9a-f]{2})|\\([0-7]{3})|\\([0abfnrtv\\'"]))/i,
      (input, hex, octal, char: string) => {
        if (hex) return String.fromCodePoint(parseInt(hex, 16));
        if (octal) return String.fromCharCode(parseInt(octal, 8) % 0x100);
        if (char) return charMap[char.toLowerCase() as keyof typeof charMap];
        return input;
      },
    );
}

const charMap = {
  "0": "\x00",
  "a": "\x07",
  "b": "\x08",
  "f": "\x0C",
  "n": "\x0A",
  "r": "\x0D",
  "t": "\x09",
  "v": "\x0B",
  "\\": "\x5C",
  "'": "\x27",
  '"': "\x22",
};
