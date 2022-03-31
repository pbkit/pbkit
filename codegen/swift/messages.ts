import { StringReader } from "https://deno.land/std@0.122.0/io/mod.ts";
import * as schema from "../../core/schema/model.ts";
import { snakeToCamel } from "../../misc/case.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import { CustomTypeMapping, GenMessagesConfig } from "./index.ts";
import { toCamelCase } from "./swift-protobuf/case.ts";

export interface GenConfig {
  messages: GenMessagesConfig;
  customTypeMapping: CustomTypeMapping;
}
export default function* gen(
  schema: schema.Schema,
  config: GenConfig,
): Generator<CodeEntry> {
  const { messages, customTypeMapping } = config;
  for (const [typePath, type] of Object.entries(schema.types)) {
    switch (type.kind) {
      case "enum":
        yield* genEnum({ schema, type, typePath, messages });
        continue;
      case "message":
        yield* genMessage({
          schema,
          type,
          typePath,
          messages,
          customTypeMapping,
        });
        continue;
    }
  }
}

interface GenEnumConfig {
  schema: schema.Schema;
  type: schema.Enum;
  typePath: string;
  messages: GenMessagesConfig;
}
function* genEnum(config: GenEnumConfig): Generator<CodeEntry> {
  const { schema, type, typePath, messages } = config;
  const { parentTypePath, relativeTypePath } = getTypePath({
    schema,
    typePath,
  });
  const swiftName = toSwiftName(relativeTypePath);
  const swiftFullName = getSwiftFullName({ schema, typePath });
  const parentSwiftFullName = getSwiftFullName({
    schema,
    typePath: parentTypePath,
  });
  const filePath = getFilePath(typePath, messages);
  const fields = Object.entries<schema.EnumField>({
    "0": { description: "", name: "UNSPECIFIED", options: {} },
    ...type.fields,
  });
  yield [
    filePath,
    new StringReader(
      [
        getImportCode(),
        getProtocGenSwiftVersionCode(),
        getTypeExtensionCodeBase(parentSwiftFullName, [
          `public enum ${swiftName}: SwiftProtobuf.Enum {\n`,
          "  public typealias RawValue = Int\n",
          ...fields.map(([fieldNumber, { name }]) =>
            `  case ${toCamelCase(name)} // = ${fieldNumber}\n`
          ),
          "  case UNRECOGNIZED(Int)\n",
          "\n",
          "  public init() {\n",
          `    self = .${
            toCamelCase(
              fields.find(([fieldNumber]) => fieldNumber === "0")![1].name,
            )
          }\n`,
          "  }\n",
          "\n",
          "  public init?(rawValue: Int) {\n",
          "    switch rawValue {\n",
          ...fields.map(([fieldNumber, { name }]) =>
            `    case ${fieldNumber}: self = .${toCamelCase(name)}\n`
          ),
          "    default: self = .UNRECOGNIZED(rawValue)\n",
          "    }\n",
          "  }\n",
          "\n",
          "  public var rawValue: Int {\n",
          "    switch self {\n",
          ...fields.map(([fieldNumber, { name }]) =>
            `    case .${toCamelCase(name)}: return ${fieldNumber}\n`
          ),
          "    case .UNRECOGNIZED(let value): return value\n",
          "    }\n",
          "  }\n",
          "}\n",
        ]),
        "\n",
        getCaseIterable(),
        "\n",
        getProtoNameMap(),
      ].join(""),
    ),
  ];
  function getCaseIterable() {
    return [
      `#if swift(>=4.2)\n\n`,
      `extension ${swiftFullName}: CaseIterable {\n`,
      `  public static var allCases: [${swiftFullName}] {\n`,
      "    return [\n",
      ...fields.map(([fieldNumber, { name }]) =>
        `      .${toCamelCase(name)},\n`
      ),
      "    ]\n",
      "  }\n",
      "}\n\n",
      `#endif\n`,
    ].join("");
  }
  // @TODO(hyp3rflow): I think that this can be in struct without using extension.
  function getProtoNameMap() {
    return [
      `extension ${swiftFullName}: SwiftProtobuf._ProtoNameProviding {\n`,
      "  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [\n",
      ...fields.map(([fieldNumber, { name }]) =>
        `    ${fieldNumber}: .same(proto: "${name}"),\n`
      ),
      "  ]\n",
      "}\n",
    ].join("");
  }
}

// @TODO(refactor): duplicate of codegen/ts/messages.ts:L124-L142
interface Message {
  schema: schema.Message;
  collectionFieldNumbers: Set<number>;
  everyFieldNames: Map<number, string>;
  fields: Field[];
  oneofFields: OneofField[];
}
export interface Field {
  schema: schema.MessageField;
  fieldNumber: number;
  childSwiftName: string;
  swiftType: string;
  isEnum: boolean;
  default: string | undefined;
}
interface OneofField {
  swiftName: string;
  fields: Field[];
}
interface GenMessageConfig {
  schema: schema.Schema;
  typePath: string;
  type: schema.Message;
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
}
function* genMessage(
  { schema, typePath, type, customTypeMapping, messages }: GenMessageConfig,
): Generator<CodeEntry> {
  const filePath = getFilePath(typePath, messages);
  const { parentTypePath, relativeTypePath } = getTypePath({
    schema,
    typePath,
  });
  const swiftName = toSwiftName(relativeTypePath);
  const swiftFullName = getSwiftFullName({ schema, typePath });
  const parentSwiftFullName = getSwiftFullName({
    schema,
    typePath: parentTypePath,
  });
  type NonOneofMessageField = Exclude<schema.MessageField, schema.OneofField>;
  const schemaFields = Object.entries(type.fields);
  const schemaOneofFields = schemaFields.filter(
    ([, field]) => field.kind === "oneof",
  ) as [string, schema.OneofField][];
  const schemaNonOneofFields = schemaFields.filter(
    ([, field]) => field.kind !== "oneof",
  ) as [string, NonOneofMessageField][];
  const collections = schemaNonOneofFields.filter(
    ([, field]) => field.kind === "map" || field.kind === "repeated",
  );
  const collectionFieldNumbers = new Set(
    collections.map(([fieldNumber]) => +fieldNumber),
  );
  const everyFieldNames = new Map(
    schemaFields.map(
      ([fieldNumber, { name }]) => [+fieldNumber, toCamelCase(name)],
    ),
  );
  const oneofFieldTable: { [oneof: string]: OneofField } = {};
  for (const schemaOneofField of schemaOneofFields) {
    const [, schemaField] = schemaOneofField;
    if (schemaField.kind !== "oneof") continue;
    const swiftName = toCamelCase(schemaField.oneof);
    const oneofField = oneofFieldTable[swiftName] ?? { swiftName, fields: [] };
    oneofField.fields.push(toField(schemaOneofField));
    oneofFieldTable[swiftName] = oneofField;
  }
  const message: Message = {
    schema: type,
    collectionFieldNumbers,
    everyFieldNames,
    fields: schemaNonOneofFields.map(toField),
    oneofFields: Object.values(oneofFieldTable),
  };
  yield [
    filePath,
    new StringReader([
      getImportCode(),
      getProtocGenSwiftVersionCode(),
      getTypeExtensionCodeBase(parentSwiftFullName, [
        `public struct ${swiftName} {\n`,
        ...message.fields.map(
          (
            {
              childSwiftName,
              swiftType,
              default: defaultValue,
              schema: { kind },
            },
          ) => {
            const isRepeated = kind === "repeated";
            return `  public var ${childSwiftName}: ${
              isRepeated ? `[${swiftType}]` : swiftType
            }${defaultValue !== undefined ? ` = ${defaultValue}` : ""}\n\n`;
          },
        ),
        ...message.oneofFields.map(({ swiftName, fields }) => {
          const capitializedSwiftName = toCamelCase(swiftName, true);
          const parentSwiftName = toSwiftName(relativeTypePath);
          const parentOneofName =
            `${parentSwiftName}.OneOf_${capitializedSwiftName}`;
          return [
            `  public var ${swiftName}: ${parentOneofName}? = nil\n\n`,
            ...fields.map(
              ({ childSwiftName, swiftType }) => {
                return [
                  `  public var ${childSwiftName}: ${swiftType} {\n`,
                  `    get {\n`,
                  `      if case .${childSwiftName}(let v)? = ${swiftName} {return v}\n`,
                  `      return ${swiftType}\n`, // @TODO: default value initializer
                  `    }\n`,
                  `    set {${swiftName} = .${childSwiftName}(newValue)}\n`,
                  `  }\n\n`,
                ].join("");
              },
            ),
            `  public enum OneOf_${capitializedSwiftName}: Equatable {\n`,
            ...fields.map(({ childSwiftName, swiftType }) => {
              return [
                `    case ${childSwiftName}(${swiftType})\n`,
              ].join("");
            }),
            "\n",
            `    #if !swift(>=4.1)\n`,
            `    public static func == (lhs: ${parentOneofName}, rhs: ${parentOneofName}) -> Bool {\n`,
            `      switch (lhs, rhs) {\n`,
            ...fields.map(({ childSwiftName }) => {
              return [
                `      case (.${childSwiftName}, .${childSwiftName}): return {\n`,
                `        guard case .${childSwiftName}(let l) = lhs, case .${childSwiftName}(let r) = rhs else { preconditionFailure() }\n`,
                `        return l == r\n`,
                `      }()\n`,
              ].join("");
            }),
            `      default:\n`,
            `        return false\n`,
            `      }\n`,
            `    }\n`,
            `    #endif\n`,
            `  }\n\n`,
          ].join("");
        }),
        "  public var unknownFields = SwiftProtobuf.UnknownStorage()\n",
        "\n",
        "  public init() {}\n",
        "}\n",
      ]),
    ].join("")),
  ];
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      childSwiftName: toCamelCase(field.name),
      swiftType: getFieldTypeCode(field),
      isEnum: getFieldIsEnum(field),
      default: getFieldDefaultCode(field),
    };
  }
  function getFieldTypeCode(field: schema.MessageField): string {
    if (field.kind !== "map") return toSwiftType(field.typePath);
    const keyTypeName = toSwiftType(field.keyTypePath);
    const valueTypeName = toSwiftType(field.valueTypePath);
    return `Dictionary<${keyTypeName}, ${valueTypeName}>`;
  }
  function getFieldIsEnum(field: schema.MessageField): boolean {
    if (field.kind === "map") return false;
    if (!field.typePath) return false;
    return schema.types[field.typePath]?.kind === "enum";
  }
  function getFieldDefaultCode(field: schema.MessageField): string | undefined {
    if (field.kind === "repeated") return "[]";
    if (field.kind === "map") return "[:]";
    // if (field.typePath! in scalarTypeDefaultValueCodes) {
    //   return scalarTypeDefaultValueCodes[field.typePath as ScalarValueTypePath];
    // }
    const fieldType = schema.types[field.typePath!];
    if (fieldType?.kind === "enum") {
      return `.${toCamelCase(fieldType.fields[0]?.name) ?? "UNSPECIFIED"}`;
    }
  }
  function toSwiftType(typePath?: string) {
    if (!typePath) return "Unknown";
    return isScalarTypePath(typePath)
      ? getScalarTypePath(typePath)
      : toSwiftName(typePath);
    function isScalarTypePath(typePath: string): boolean {
      return false;
    }
    function getScalarTypePath(typePath: string): string {
      return typePath;
    }
  }
}

interface GetTypePathConfig {
  schema: schema.Schema;
  typePath: string;
}
function getTypePath(
  { schema, typePath }: GetTypePathConfig,
): { parentTypePath?: string; relativeTypePath: string } {
  const fragments = typePath.split(".");
  const typeName = fragments.pop()!;
  const parentTypePath = fragments.join(".");
  if (Object.keys(schema.types).includes(parentTypePath)) {
    return { parentTypePath, relativeTypePath: "." + typeName };
  }
  return { relativeTypePath: typePath };
}

interface GetSwiftFullNameConfig {
  schema: schema.Schema;
  typePath?: string;
}
function getSwiftFullName(
  { schema, typePath }: GetSwiftFullNameConfig,
): string | undefined {
  if (!typePath) return;
  const { parentTypePath, relativeTypePath } = getTypePath({
    schema,
    typePath,
  });
  if (!parentTypePath) return toSwiftName(relativeTypePath);
  return getSwiftFullName({ schema, typePath: parentTypePath }) +
    `.${toSwiftName(relativeTypePath)}`;
}

export function getFilePath(
  typePath: string,
  messages: GenMessagesConfig,
  ext = ".pb.swift",
): string {
  return join(
    messages.outDir,
    typePath
      .replace(/^\./, "")
      .replaceAll(".", "/")
      .replaceAll(/\b([A-Z][^/]*)\//g, "($1)/") + ext,
  );
}

function getTypeExtensionCodeBase(
  parentSwiftName: string | undefined,
  codes: string[],
) {
  if (parentSwiftName) {
    return [
      `extension ${parentSwiftName} {\n`,
      ...codes.map((code) => code ? `  ${code}` : code),
      "}\n",
    ].join("");
  }
  return codes.join("");
}

export function getImportCode() {
  return [
    "import SwiftProtobuf\n",
    "import Foundation\n",
    "\n",
  ].join("");
}

export function getProtocGenSwiftVersionCode() {
  return [
    "fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {\n",
    "  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}\n",
    "  typealias Version = _2\n",
    "}\n",
    "\n",
  ].join("");
}

// ---

function toSwiftType(typePath?: string) {
  if (!typePath) return "Unknown";
  return isScalarTypePath(typePath)
    ? getScalarTypePath(typePath)
    : toSwiftName(typePath);
  function isScalarTypePath(typePath: string): boolean {
    return false;
  }
  function getScalarTypePath(typePath: string): string {
    return typePath;
  }
}

function toSwiftName(typePath: string) {
  return typePath.split(".").slice(1).map((fragment) =>
    fragment.charAt(0).toUpperCase() + fragment.slice(1)
  ).join("_");
}
