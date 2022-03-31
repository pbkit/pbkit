import { StringReader } from "https://deno.land/std@0.122.0/io/mod.ts";
import { ScalarValueTypePath } from "../../core/runtime/scalar.ts";
import * as schema from "../../core/schema/model.ts";
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

interface Enum {
  schema: schema.Enum;
  fields: [string, schema.EnumField][];
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
  const packageName = getPackageName(schema.files, type.filePath);
  const fields = Object.entries<schema.EnumField>({
    "0": { description: "", name: "UNSPECIFIED", options: {} },
    ...type.fields,
  });
  const getCodeConfig: GetEnumCodeConfig = {
    enum: { schema: type, fields },
    typePath,
    messages,
    swiftName,
    swiftFullName,
    parentSwiftFullName,
  };
  const typeExtensionCode = getTypeExtensionCode(getCodeConfig);
  const protoNameMapCode = getNameMapCode(getCodeConfig);
  yield [
    filePath,
    new StringReader(
      [
        `fileprivate let _protobuf_package = "${packageName}"\n`,
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
        protoNameMapCode,
        "\n",
        typeExtensionCode,
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
  swiftName: string;
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
  console.log({ customTypeMapping });
  const filePath = getFilePath(typePath, messages);
  const packageName = getPackageName(schema.files, type.filePath);
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
  const getCodeConfig: GetMessageCodeConfig = {
    typePath,
    message,
    messages,
    customTypeMapping,
    swiftName,
    swiftFullName,
    parentSwiftFullName,
  };
  const typeDefCode = getMessageTypeDefCode(getCodeConfig);
  const decodeMessageCode = getDecodeMessageCode(getCodeConfig);
  const traverseCode = getTraverseCode(getCodeConfig);
  const typeExtensionCode = getTypeExtensionCode(getCodeConfig);
  const protoNameMapCode = getNameMapCode(getCodeConfig);
  yield [
    filePath,
    new StringReader([
      getImportCode(),
      `fileprivate let _protobuf_package = "${packageName}"\n`,
      getProtocGenSwiftVersionCode(),
      typeDefCode,
      "\n",
      typeExtensionCode,
      "\n",
      protoNameMapCode,
      "\n",
      decodeMessageCode,
      // "\n",
      // traverseCode,
    ].join("")),
  ];
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      swiftName: toCamelCase(field.name),
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
    return pbTypeToSwiftType({ customTypeMapping, messages, typePath });
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
  config: { schema: schema.Schema; typePath: string },
): string;
function getSwiftFullName(
  config: { schema: schema.Schema; typePath?: string },
): string | undefined;
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

// @TODO(hyp3rflow): handling on undefined
function getPackageName(files: schema.Schema["files"], filePath: string) {
  return files[filePath]?.package ?? "";
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

interface GetCodeConfig {
  typePath: string;
  swiftName: string;
  swiftFullName: string;
  parentSwiftFullName?: string;
  messages: GenMessagesConfig;
}
interface GetMessageCodeConfig extends GetCodeConfig {
  message: Message;
  customTypeMapping: CustomTypeMapping;
}
interface GetEnumCodeConfig extends GetCodeConfig {
  enum: Enum;
}
type GetCodeFn<T extends GetCodeConfig = GetCodeConfig> = (config: T) => string;

const getMessageTypeDefCode: GetCodeFn<GetMessageCodeConfig> = (config) => {
  const { message } = config;
  const typeBodyCodes: string[] = [];
  if (message.fields.length) typeBodyCodes.push(getFieldsCode());
  if (message.oneofFields.length) typeBodyCodes.push(getOneofsCode());
  return getTypeExtensionCodeBase(config.parentSwiftFullName, [
    `public struct ${config.swiftName} {\n`,
    ...typeBodyCodes,
    "  public var unknownFields = SwiftProtobuf.UnknownStorage()\n\n",
    "  public init() {}\n",
    "}\n",
  ]);
  function getFieldsCode() {
    return message.fields.map(
      (
        {
          swiftName,
          swiftType,
          default: defaultValue,
          schema: { kind },
        },
      ) => {
        const isRepeated = kind === "repeated";
        return `  public var ${swiftName}: ${
          isRepeated ? `[${swiftType}]` : swiftType
        }${defaultValue !== undefined ? ` = ${defaultValue}` : ""}\n\n`;
      },
    ).join("");
  }
  function getOneofsCode() {
    return message.oneofFields.map(({ swiftName, fields }) => {
      const capitializedSwiftName = toCamelCase(swiftName, true);
      const parentOneofName =
        `${config.swiftName}.OneOf_${capitializedSwiftName}`;
      const oneofVariableCode = getOneofVariableCode();
      const oneofFieldCode = getOneofFieldCode();
      const oneofEquatableEnumCode = getOneofEquatableEnumCode();
      return [
        oneofVariableCode,
        oneofFieldCode,
        oneofEquatableEnumCode,
      ].join("");
      function getOneofVariableCode() {
        return `  public var ${swiftName}: ${parentOneofName}? = nil\n\n`;
      }
      function getOneofFieldCode() {
        return fields.map(
          ({ swiftName: fieldSwiftName, swiftType }) => {
            return [
              `  public var ${fieldSwiftName}: ${swiftType} {\n`,
              `    get {\n`,
              `      if case .${fieldSwiftName}(let v)? = ${swiftName} {return v}\n`,
              `      return ${swiftType}\n`, // @TODO: default value initializer
              `    }\n`,
              `    set {${swiftName} = .${fieldSwiftName}(newValue)}\n`,
              `  }\n\n`,
            ].join("");
          },
        ).join("");
      }
      function getOneofEquatableEnumCode() {
        return [
          `  public enum OneOf_${capitializedSwiftName}: Equatable {\n`,
          ...fields.map(({ swiftName: fieldSwiftName, swiftType }) => {
            return [
              `    case ${fieldSwiftName}(${swiftType})\n`,
            ].join("");
          }),
          "\n",
          `    #if !swift(>=4.1)\n`,
          `    public static func == (lhs: ${parentOneofName}, rhs: ${parentOneofName}) -> Bool {\n`,
          `      switch (lhs, rhs) {\n`,
          ...fields.map(({ swiftName }) => {
            return [
              `      case (.${swiftName}, .${swiftName}): return {\n`,
              `        guard case .${swiftName}(let l) = lhs, case .${swiftName}(let r) = rhs else { preconditionFailure() }\n`,
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
      }
    }).join("");
  }
};

const getNameMapCode: GetCodeFn<GetEnumCodeConfig | GetMessageCodeConfig> = (
  config,
) => {
  const { swiftFullName } = config;
  const buffer = [
    `extension ${swiftFullName}: SwiftProtobuf._ProtoNameProviding {\n`,
    "  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [\n",
  ];
  if (isGetEnumCodeConfig(config)) {
    const { enum: { fields } } = config;
    buffer.push(
      ...fields.map(([fieldNumber, { name }]) =>
        `    ${fieldNumber}: .same(proto: "${name}"),\n`
      ),
    );
  } else {
    const { message: { schema: { fields: _fields } } } = config;
    const fields = Object.entries(_fields);
    buffer.push(
      ...fields.map((
        [fieldNumber, { name }],
      ) => `    ${fieldNumber}: .same(proto: "${name}"),\n`),
    );
  }
  buffer.push(
    "  ]\n",
    "}\n",
  );
  return buffer.join("");
};

const getDecodeMessageCode: GetCodeFn<GetMessageCodeConfig> = (config) => {
  return [
    `extension ${config.swiftFullName}: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {\n`,
    `  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {\n`,
    `    while let fieldNumber = try decoder.nextFieldNumber() {\n`,
    `      switch fieldNumber {\n`,
    ...config.message.fields.map(
      ({
        fieldNumber,
        swiftName,
        swiftType,
        schema: { kind },
      }) => {
        const isRepeated = kind === "repeated";
        if (kind === "map") {
          return [
            // @TODO(hyp3rflow): SwiftProtobuf.ProtobufString
            `      case ${fieldNumber}: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.${swiftName}) }()\n`,
          ].join("");
        }
        return [
          `      case ${fieldNumber}: try { try decoder.decode${
            isRepeated ? "Repeated" : "Singular"
          }${swiftType}Field(value: &self.${swiftName}) }()\n`,
        ].join("");
      },
    ),
    ...config.message.oneofFields.map(
      ({
        swiftName: parentSwiftName,
        fields,
      }) => {
        return fields.map(({
          fieldNumber,
          swiftName,
          swiftType,
          schema: { kind },
        }) => {
          const isRepeated = kind === "repeated";
          return [
            `      case ${fieldNumber}: try {\n`,
            `        var v: ${swiftType}?\n`,
            `        try decoder.decode${
              isRepeated ? "Repeated" : "Singular"
            }${swiftType}Field(value: &v)\n`,
            `        if let v = v {\n`,
            `          if self.${parentSwiftName} != nil {try decoder.handleConflictingOneOf()}\n`,
            `          self.${parentSwiftName} = .${swiftName}(v)\n`,
            `        }\n`,
            `      }()\n`,
          ].join("");
        }).join("");
      },
    ),
    `      default: break\n`,
    `      }\n`,
    `    }\n`,
    `  }\n`,
    `}\n`,
  ].join("");
};

const getTraverseCode: GetCodeFn<GetMessageCodeConfig> = (config) => {
  return [
    `extension ${config.swiftFullName}: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {\n`,
    `  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {\n`,
    `    switch fieldNumber {\n`,
    ...config.message.fields.map(
      ({
        fieldNumber,
        swiftName,
        swiftType,
        schema: { kind },
      }) => {
        const isRepeated = kind === "repeated";
        if (kind === "map") {
          return [
            // @TODO(hyp3rflow): SwiftProtobuf.ProtobufString
            `      case ${fieldNumber}: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.${swiftName}) }()\n`,
          ].join("");
        }
        return [
          `      case ${fieldNumber}: try { try decoder.decode${
            isRepeated ? "Repeated" : "Singular"
          }${swiftType}Field(value: &self.${swiftName}) }()\n`,
        ].join("");
      },
    ),
    ...config.message.oneofFields.map(
      ({
        swiftName: parentSwiftName,
        fields,
      }) => {
        return fields.map(({
          fieldNumber,
          swiftName,
          swiftType,
          schema: { kind },
        }) => {
          const isRepeated = kind === "repeated";
          return [
            `      case ${fieldNumber}: try {\n`,
            `        var v: ${swiftType}?\n`,
            `        try decoder.decode${
              isRepeated ? "Repeated" : "Singular"
            }${swiftType}Field(value: &v)\n`,
            `        if let v = v {\n`,
            `          if self.${parentSwiftName} != nil {try decoder.handleConflictingOneOf()}\n`,
            `          self.${parentSwiftName} = .${swiftName}(v)\n`,
            `        }\n`,
            `      }()\n`,
          ].join("");
        }).join("");
      },
    ),
    `      default: break\n`,
    `    }\n`,
    `  }\n`,
    `}\n`,
  ].join("");
};

const getTypeExtensionCode: GetCodeFn<GetCodeConfig | GetMessageCodeConfig> = (
  config,
) => {
  const sendableCode = getSendableCode();
  return [sendableCode].join("");
  function getSendableCode() {
    return [
      "#if swift(>=5.5) && canImport(_Concurrency)\n",
      `extension ${config.swiftFullName}: @unchecked Sendable {}\n`,
      isGetMessageCodeConfig(config)
        ? config.message.oneofFields.map(({ swiftName }) => {
          return `extension ${config.swiftName}.OneOf_${
            toCamelCase(swiftName, true)
          }: @unchecked Sendable {}\n`;
        })
        : "",
      "#endif\n",
    ].join("");
  }
};

function isGetMessageCodeConfig(
  config: GetCodeConfig | GetMessageCodeConfig | GetEnumCodeConfig,
): config is GetMessageCodeConfig {
  return (config as GetMessageCodeConfig).message != undefined &&
    (config as GetMessageCodeConfig).customTypeMapping != undefined;
}

function isGetEnumCodeConfig(
  config: GetCodeConfig | GetMessageCodeConfig | GetEnumCodeConfig,
): config is GetEnumCodeConfig {
  return (config as GetEnumCodeConfig).enum != undefined;
}

export interface PbTypeToSwiftTypeConfig {
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
  typePath?: string;
}
export function pbTypeToSwiftType({
  customTypeMapping,
  messages,
  typePath,
}: PbTypeToSwiftTypeConfig): string {
  if (!typePath) return "Unknown";
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
  if (typePath in customTypeMapping) {
    return customTypeMapping[typePath].swiftType;
  }
  // @TODO(hyp3rflow)
  console.log("pbTypeToSwiftType", "TODO: fallback");
  return toSwiftName(typePath);
}

type ScalarToCodeTable = { [typePath in ScalarValueTypePath]: string };
const scalarTypeMapping: ScalarToCodeTable = {
  ".double": "Double",
  ".float": "Float",
  ".int32": "Int32",
  ".int64": "Int64",
  ".uint32": "UInt32",
  ".uint64": "UInt64",
  ".sint32": "Int32",
  ".sint64": "Int64",
  ".fixed32": "UInt32",
  ".fixed64": "UInt64",
  ".sfixed32": "Int32",
  ".sfixed64": "Int64",
  ".bool": "Bool",
  ".string": "String",
  ".bytes": "Data",
};
const scalarTypeDefaultValueCodes: ScalarToCodeTable = {
  ".double": "0",
  ".float": "0",
  ".int32": "0",
  ".int64": '"0"',
  ".uint32": "0",
  ".uint64": '"0"',
  ".sint32": "0",
  ".sint64": '"0"',
  ".fixed32": "0",
  ".fixed64": '"0"',
  ".sfixed32": "0",
  ".sfixed64": '"0"',
  ".bool": "false",
  ".string": "String()",
  ".bytes": "Data()",
};

function toSwiftName(typePath: string) {
  return typePath.split(".").slice(1).map((fragment) =>
    fragment.charAt(0).toUpperCase() + fragment.slice(1)
  ).join("_");
}
