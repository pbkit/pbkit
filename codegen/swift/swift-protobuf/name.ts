import { range } from "./range.ts";

const appreviations = ["url", "http", "https", "id"];

// https://github.com/apple/swift-protobuf/blob/8784605093f1464b3a52d3e89568008217ddccdb/Sources/SwiftProtobufPluginLibrary/NamingUtils.swift#L278
export function toCamelCase(str: string, initialUpperCase?: boolean) {
  let result = "";
  let current = "";
  let lastClass = getCharClass("\0");
  for (const scalar of str) {
    const scalarClass = getCharClass(scalar);
    switch (scalarClass) {
      case "digit":
        if (lastClass !== "digit") addCurrent();
        if (!result.length) result += "_";
        current += scalar;
        break;
      case "upper":
        if (lastClass !== "upper") addCurrent();
        current += scalar.toLowerCase();
        break;
      case "lower":
        if (lastClass !== "lower" && lastClass !== "upper") addCurrent();
        current += scalar;
        break;
      case "underscore":
        addCurrent();
        if (lastClass === "underscore") result += "_";
        break;
      case "other":
        addCurrent();
        const escapeIt = result.length
          ? !isSwiftIdentifierCharacter(scalar)
          : !isSwiftIdentifierHeadCharacter(scalar);
        if (escapeIt) result += `_u${scalar.charCodeAt(0)}`;
        else current += scalar;
        break;
    }
    lastClass = scalarClass;
  }
  addCurrent();
  if (lastClass === "underscore") result += "_";
  return result;
  function addCurrent() {
    if (!current.length) return;
    let currentAsString = current;
    if (!result.length && !initialUpperCase) {
      // nothing.
    } else if (appreviations.includes(currentAsString)) {
      currentAsString = currentAsString.toUpperCase();
    } else {
      currentAsString = uppercaseFirstCharacter(currentAsString);
    }
    result += currentAsString;
    current = "";
  }
  function getCharClass(scalar: string) {
    if (scalar.length !== 1) throw new Error("Unexpected length of string!");
    if (scalar >= "0" && scalar <= "9") return "digit";
    if (scalar === "_") return "underscore";
    if (scalar === scalar.toLowerCase()) return "lower";
    if (scalar === scalar.toUpperCase()) return "upper";
    return "other";
  }
}

function uppercaseFirstCharacter(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}

function isSwiftIdentifierCharacter(scalar: string) {
  return identifierCharacterRanges.some((range) =>
    range.includes(scalar.charCodeAt(0))
  ) || isSwiftIdentifierHeadCharacter(scalar);
}

function isSwiftIdentifierHeadCharacter(scalar: string) {
  return identifierHeadCharacterRanges.some((range) =>
    range.includes(scalar.charCodeAt(0))
  );
}

const identifierCharacterRanges = [
  range(0x30, 0x39),
  range(0x300, 0x36F),
  range(0x1dc0, 0x1dff),
  range(0x20d0, 0x20ff),
  range(0xfe20, 0xfe2f),
];

const identifierHeadCharacterRanges = [
  range(0x61, 0x7a),
  range(0x41, 0x5a),
  range(0x5f),
  range(0xa8),
  range(0xaa),
  range(0xad),
  range(0xaf),
  range(0xb2, 0xb5),
  range(0xb7, 0xba),
  range(0xbc, 0xbe),
  range(0xc0, 0xd6),
  range(0xd8, 0xf6),
  range(0xf8, 0xff),
  range(0x100, 0x2ff),
  range(0x370, 0x167f),
  range(0x1681, 0x180d),
  range(0x180f, 0x1dbf),
  range(0x1e00, 0x1fff),
  range(0x200b, 0x200d),
  range(0x202a, 0x202e),
  range(0x203F),
  range(0x2040),
  range(0x2054),
  range(0x2060, 0x206f),
  range(0x2070, 0x20cf),
  range(0x2100, 0x218f),
  range(0x2460, 0x24ff),
  range(0x2776, 0x2793),
  range(0x2c00, 0x2dff),
  range(0x2e80, 0x2fff),
  range(0x3004, 0x3007),
  range(0x3021, 0x302f),
  range(0x3031, 0x303f),
  range(0x3040, 0xd7ff),
  range(0xf900, 0xfd3d),
  range(0xfd40, 0xfdcf),
  range(0xfdf0, 0xfe1f),
  range(0xfe30, 0xfe44),
  range(0xfe47, 0xfffd),
  range(0x10000, 0x1fffd),
  range(0x20000, 0x2fffd),
  range(0x30000, 0x3fffd),
  range(0x40000, 0x4fffd),
  range(0x50000, 0x5fffd),
  range(0x60000, 0x6fffd),
  range(0x70000, 0x7fffd),
  range(0x80000, 0x8fffd),
  range(0x90000, 0x9fffd),
  range(0xa0000, 0xafffd),
  range(0xb0000, 0xbfffd),
  range(0xc0000, 0xcfffd),
  range(0xd0000, 0xdfffd),
  range(0xe0000, 0xefffd),
];

const swiftKeywordsUsedInDeclarations: string[] = [
  "associatedtype",
  "class",
  "deinit",
  "enum",
  "extension",
  "fileprivate",
  "func",
  "import",
  "init",
  "inout",
  "internal",
  "let",
  "open",
  "operator",
  "private",
  "protocol",
  "public",
  "static",
  "struct",
  "subscript",
  "typealias",
  "var",
];

const swiftKeywordsUsedInStatements: string[] = [
  "break",
  "case",
  "continue",
  "default",
  "defer",
  "do",
  "else",
  "fallthrough",
  "for",
  "guard",
  "if",
  "in",
  "repeat",
  "return",
  "switch",
  "where",
  "while",
];

const swiftKeywordsUsedInExpressionsAndTypes: string[] = [
  "as",
  "Any",
  "catch",
  "false",
  "is",
  "nil",
  "rethrows",
  "super",
  "self",
  "Self",
  "throw",
  "throws",
  "true",
  "try",
];

const swiftKeywordsWithNumberSign: string[] = [
  "#available",
  "#colorLiteral",
  "#column",
  "#else",
  "#elseif",
  "#endif",
  "#file",
  "#fileLiteral",
  "#function",
  "#if",
  "#imageLiteral",
  "#line",
  "#selector",
  "#sourceLocation",
];

const swiftKeywordsReservedInParticularContexts: string[] = [
  "associativity",
  "convenience",
  "dynamic",
  "didSet",
  "final",
  "get",
  "infix",
  "indirect",
  "lazy",
  "left",
  "mutating",
  "none",
  "nonmutating",
  "optional",
  "override",
  "postfix",
  "precedence",
  "prefix",
  "Protocol",
  "required",
  "right",
  "set",
  "Type",
  "unowned",
  "weak",
  "willSet",
];

const swiftCommonTypes: string[] = [
  "Bool",
  "Data",
  "Double",
  "Float",
  "Int",
  "Int32",
  "Int64",
  "String",
  "UInt",
  "UInt32",
  "UInt64",
];

const swiftSpecialVariables: string[] = [
  "__COLUMN__",
  "__FILE__",
  "__FUNCTION__",
  "__LINE__",
];

const reservedTypeNames: string[] = [
  ...swiftCommonTypes,
  ...swiftKeywordsUsedInDeclarations,
  ...swiftKeywordsUsedInExpressionsAndTypes,
  ...swiftKeywordsUsedInStatements,
  ...swiftSpecialVariables,
  "SwiftProtobuf",
  "Extensions",
  "protoMessageName",
  "decodeMessage",
  "traverse",
  "isInitialized",
  "unknownFields",
  "debugDescription",
  "description",
  "dynamicType",
  "hashValue",
  "Type",
  "Protocol",
];

const reservedFieldNames: string[] = [
  ...swiftCommonTypes,
  ...swiftSpecialVariables,
  "isInitialized",
  "unknownFields",
  "debugDescription",
  "description",
  "dynamicType",
  "hashValue",
  "init",
  "self",
  "Type",
  "Protocol",
];

const quotableFieldNames: string[] = [
  ...swiftKeywordsUsedInDeclarations,
  ...swiftKeywordsUsedInStatements,
  ...swiftKeywordsUsedInExpressionsAndTypes,
];

const reservedEnumCases: string[] = [
  "allCases",
  "debugDescription",
  "description",
  "dynamicType",
  "hashValue",
  "init",
  "rawValue",
  "self",
];

const quotableEnumCases: string[] = [
  "associativity",
  "dynamicType",
  "optional",
  "required",
  ...swiftKeywordsUsedInDeclarations,
  ...swiftKeywordsUsedInStatements,
  ...swiftKeywordsUsedInExpressionsAndTypes,
];

export function sanitizeMessageName(messageName: string) {
  return sanitizeTypeName(messageName, "Message");
}

export function sanitizeEnumName(enumName: string) {
  return sanitizeTypeName(enumName, "Enum");
}

export function sanitizeOneofName(oneofName: string) {
  return sanitizeTypeName(oneofName, "Oneof");
}

export function sanitizeEnumCaseName(enumCaseName: string) {
  if (reservedEnumCases.includes(enumCaseName)) {
    return enumCaseName + "_";
  }
  if (quotableEnumCases.includes(enumCaseName)) {
    return `\`${enumCaseName}\``;
  }
  return enumCaseName;
}

// @TODO: Improve codes
// https://github.com/apple/swift-protobuf/blob/8784605093f1464b3a52d3e89568008217ddccdb/Sources/SwiftProtobufPluginLibrary/NamingUtils.swift#L182
function sanitizeTypeName(str: string, disambiguator: string) {
  if (reservedTypeNames.includes(str)) {
    return str + disambiguator;
  }
  return str;
}

// https://github.com/apple/swift-protobuf/blob/8784605093f1464b3a52d3e89568008217ddccdb/Sources/SwiftProtobufPluginLibrary/NamingUtils.swift#L490
export function sanitizeFieldName(fieldName: string, _basedOn?: string) {
  const basedOn = _basedOn ?? fieldName;
  if (basedOn.startsWith("clear") && isCharAtUpperCase(basedOn, 5)) {
    return fieldName + "_p";
  }
  if (basedOn.startsWith("has") && isCharAtUpperCase(basedOn, 3)) {
    return fieldName + "_p";
  }
  if (reservedFieldNames.includes(basedOn)) {
    return fieldName + "_p";
  }
  if (basedOn === fieldName && quotableFieldNames.includes(fieldName)) {
    return `\`${fieldName}\``;
  }
  return fieldName;
  function isCharAtUpperCase(str: string, index: number) {
    if (str.length <= index) return false;
    return str.charAt(index) === str.charAt(index).toUpperCase();
  }
}

export function prefixStripper(name: string, prefix: string) {
  let curr = 0;
  let stripIndex = 0;
  for (const char of name) {
    if (char === "_") {
      stripIndex++;
      continue;
    }
    if (
      curr < prefix.length && char.toLowerCase() === prefix[curr].toLowerCase()
    ) {
      stripIndex++;
      curr++;
      continue;
    }
    break;
  }
  if (curr === prefix.length && curr < name.length - 1) {
    return name.substring(stripIndex);
  }
  return name;
}
