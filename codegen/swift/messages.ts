import { StringReader } from "https://deno.land/std@0.147.0/io/mod.ts";
import { ScalarValueTypePath } from "../../core/runtime/scalar.ts";
import * as schema from "../../core/schema/model.ts";
import { CodeEntry } from "../index.ts";
import { join } from "../path.ts";
import {
  CustomTypeMapping,
  GenMessagesConfig,
  getSwiftFullName,
  getTypePath,
  toSwiftName,
} from "./index.ts";
import {
  prefixStripper,
  sanitizeEnumCaseName,
  sanitizeEnumName,
  sanitizeFieldName,
  sanitizeMessageName,
  toCamelCase,
} from "./swift-protobuf/name.ts";

export interface GenConfig {
  messages: GenMessagesConfig;
  customTypeMapping: CustomTypeMapping;
}
export default function* gen(
  schema: schema.Schema,
  config: GenConfig,
): Generator<CodeEntry> {
  const { messages, customTypeMapping } = config;
  const typePaths = messages.typePaths ?? Object.keys(schema.types);
  for (const typePath of typePaths) {
    const type = schema.types[typePath];
    // Dependent on SwiftProtobuf's well-known types codegen (ex. .google.protobuf.Timestamp)
    if (typePath.startsWith(".google.protobuf")) continue;
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
  fields: [string, EnumField][];
}
interface EnumField extends schema.EnumField {
  swiftName: string;
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
  const swiftName = sanitizeEnumName(toSwiftName(relativeTypePath));
  const swiftFullName = getSwiftFullName({ schema, typePath });
  const parentSwiftFullName = getSwiftFullName({
    schema,
    typePath: parentTypePath,
  });
  const enumName = typePath.split(".").pop()!;
  const filePath = getFilePath(typePath, messages);
  const packageName = getPackageName(schema.files, type.filePath);
  const fields = Object.entries<schema.EnumField>({
    "0": {
      description: { leading: [], trailing: [], leadingDetached: [] },
      name: "UNSPECIFIED",
      options: {},
    },
    ...type.fields,
  });
  const getCodeConfig: GetEnumCodeConfig = {
    enum: { schema: type, fields: fields.map(toEnumField) },
    typePath,
    messages,
    swiftName,
    swiftFullName,
    parentSwiftFullName,
  };
  const typeDefCode = getEnumTypeDefCode(getCodeConfig);
  const typeExtensionCode = getTypeExtensionCode(getCodeConfig);
  const caseIterableCode = getCaseIterableCode(getCodeConfig);
  const protoNameMapCode = getNameMapCode(getCodeConfig);
  yield [
    filePath,
    new StringReader(
      [
        getImportCode(),
        `fileprivate let _protobuf_package = "${packageName}"\n`,
        getProtocGenSwiftVersionCode(),
        typeDefCode,
        "\n",
        caseIterableCode,
        "\n",
        protoNameMapCode,
        "\n",
        typeExtensionCode,
      ].join(""),
    ),
  ];
  function toEnumField(
    [fieldNumber, field]: [string, schema.EnumField],
  ): [string, EnumField] {
    return [fieldNumber, {
      ...field,
      swiftName: sanitizeEnumCaseName(
        toCamelCase(prefixStripper(field.name, enumName)),
      ),
    }];
  }
}

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
  swiftProtobufType: string; // scalar type or Message | Enum
  isEnum: boolean;
  isMessage: boolean;
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
  const packageName = getPackageName(schema.files, type.filePath);
  const { parentTypePath, relativeTypePath } = getTypePath({
    schema,
    typePath,
  });
  const swiftName = sanitizeMessageName(
    getSwiftFullName({ schema, typePath: relativeTypePath }),
  );
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
    schema,
    customTypeMapping,
    swiftName,
    swiftFullName,
    parentSwiftFullName,
    getSwiftType(typePath?: string) {
      return pbTypeToSwiftType({ customTypeMapping, schema, typePath });
    },
  };
  const typeDefCode = getMessageTypeDefCode(getCodeConfig);
  const decodeMessageCode = getDecodeMessageCode(getCodeConfig);
  const traverseCode = getTraverseCode(getCodeConfig);
  const typeExtensionCode = getTypeExtensionCode(getCodeConfig);
  const protoNameMapCode = getNameMapCode(getCodeConfig);
  const messageOperatorCode = getMessageOperatorCode(getCodeConfig);
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
      "\n",
      traverseCode,
      "\n",
      messageOperatorCode,
    ].join("")),
  ];
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      swiftName: sanitizeFieldName(toCamelCase(field.name)),
      swiftType: getFieldTypeCode(field),
      swiftProtobufType: getFieldProtobufTypeCode(field),
      isEnum: getFieldIsEnum(field),
      isMessage: getFieldIsMessage(field),
      default: getFieldDefaultCode(field),
    };
  }
  function getFieldTypeCode(field: schema.MessageField): string {
    if (field.kind !== "map") return toSwiftType(field.typePath);
    const keyTypeName = toSwiftType(field.keyTypePath);
    const valueTypeName = toSwiftType(field.valueTypePath);
    return `Dictionary<${keyTypeName}, ${valueTypeName}>`;
  }
  function getFieldProtobufTypeCode(field: schema.MessageField): string {
    if (field.kind === "map") {
      return "Map";
    }
    if (field.typePath! in schema.types) {
      const kind = schema.types[field.typePath!].kind;
      switch (kind) {
        case "message":
          return "Message";
        case "enum":
          return "Enum";
      }
    }
    if (field.typePath! in scalarSwiftProtobufTypeMapping) {
      return scalarSwiftProtobufTypeMapping[
        field.typePath as ScalarValueTypePath
      ];
    }
    return "Unknown";
  }
  function getFieldIsEnum(field: schema.MessageField): boolean {
    if (field.kind === "map") return false;
    if (!field.typePath) return false;
    return schema.types[field.typePath]?.kind === "enum";
  }
  function getFieldIsMessage(field: schema.MessageField): boolean {
    if (field.kind === "map") return false;
    if (!field.typePath) return false;
    return schema.types[field.typePath]?.kind === "message";
  }
  function getFieldDefaultCode(field: schema.MessageField): string | undefined {
    if (field.kind === "repeated") return "[]";
    if (field.kind === "map") return "[:]";
    if (field.typePath! in scalarTypeDefaultValueCodes) {
      return scalarTypeDefaultValueCodes[field.typePath as ScalarValueTypePath];
    }
    const fieldType = schema.types[field.typePath!];
    if (fieldType?.kind === "enum") {
      return ".init()";
    }
  }
  function toSwiftType(typePath?: string) {
    return pbTypeToSwiftType({ customTypeMapping, schema, typePath });
  }
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
      .replace(/^\./, "") + ext,
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
  schema: schema.Schema;
  customTypeMapping: CustomTypeMapping;
  getSwiftType(typePath?: string): string;
}
interface GetEnumCodeConfig extends GetCodeConfig {
  enum: Enum;
}
type GetCodeFn<T extends GetCodeConfig = GetCodeConfig> = (config: T) => string;

const getEnumTypeDefCode: GetCodeFn<GetEnumCodeConfig> = (config) => {
  const { parentSwiftFullName, swiftName, enum: { fields } } = config;
  return getTypeExtensionCodeBase(parentSwiftFullName, [
    `public enum ${swiftName}: SwiftProtobuf.Enum {\n`,
    "  public typealias RawValue = Int\n",
    ...fields.map(([fieldNumber, { swiftName }]) =>
      `  case ${swiftName} // = ${fieldNumber}\n`
    ),
    "  case UNRECOGNIZED(Int)\n",
    "\n",
    "  public init() {\n",
    `    self = .${
      fields.find(([fieldNumber]) => fieldNumber === "0")![1].swiftName
    }\n`,
    "  }\n",
    "\n",
    "  public init?(rawValue: Int) {\n",
    "    switch rawValue {\n",
    ...fields.map(([fieldNumber, { swiftName }]) =>
      `    case ${fieldNumber}: self = .${swiftName}\n`
    ),
    "    default: self = .UNRECOGNIZED(rawValue)\n",
    "    }\n",
    "  }\n",
    "\n",
    "  public var rawValue: Int {\n",
    "    switch self {\n",
    ...fields.map(([fieldNumber, { swiftName }]) =>
      `    case .${swiftName}: return ${fieldNumber}\n`
    ),
    "    case .UNRECOGNIZED(let value): return value\n",
    "    }\n",
    "  }\n",
    "}\n",
  ]);
};

const getCaseIterableCode: GetCodeFn<GetEnumCodeConfig> = (config) => {
  const { swiftFullName, enum: { fields } } = config;
  return [
    `#if swift(>=4.2)\n\n`,
    `extension ${swiftFullName}: CaseIterable {\n`,
    `  public static var allCases: [${swiftFullName}] {\n`,
    "    return [\n",
    ...fields.map(([, { swiftName }]) => `      .${swiftName},\n`),
    "    ]\n",
    "  }\n",
    "}\n\n",
    `#endif\n`,
  ].join("");
};

const getMessageTypeDefCode: GetCodeFn<GetMessageCodeConfig> = (config) => {
  const { message } = config;
  const typeBodyCodes: string[] = [];
  if (message.fields.length) typeBodyCodes.push(...getFieldsCode());
  if (message.oneofFields.length) typeBodyCodes.push(getOneofsCode());
  return getTypeExtensionCodeBase(config.parentSwiftFullName, [
    `public struct ${config.swiftName} {\n`,
    ...typeBodyCodes,
    "  public var unknownFields = SwiftProtobuf.UnknownStorage()\n\n",
    "  public init() {}\n",
    "}\n",
  ]);
  function getFieldsCode() {
    return message.fields.flatMap(
      (
        {
          swiftName,
          swiftType,
          default: defaultValue,
          schema,
          isMessage,
        },
      ) => {
        const isRepeated = schema.kind === "repeated";
        if (!isRepeated && isMessage) {
          return [
            `  fileprivate var _${swiftName}: ${swiftType}? = nil\n\n`,
            `  public var ${swiftName}: ${swiftType} {\n`,
            `    get {return _${swiftName} ?? ${swiftType}()}\n`,
            `    set {_${swiftName} = newValue}\n`,
            "  }\n\n",
            `  public var has${
              toCamelCase(swiftName, true)
            }: Bool {return self._${swiftName} != nil}\n\n`,
            `  public mutating func clear${
              toCamelCase(swiftName, true)
            }() {self._${swiftName} = nil}\n\n`,
          ];
        }
        return [
          `  public var ${swiftName}: ${
            isRepeated ? `[${swiftType}]` : swiftType
          }${defaultValue !== undefined ? ` = ${defaultValue}` : ""}\n\n`,
        ];
      },
    );
  }
  function getOneofsCode() {
    return message.oneofFields.map(({ swiftName, fields }) => {
      const oneofSwiftName = `OneOf_${toCamelCase(swiftName, true)}`;
      const oneofSwiftFullName = `${config.swiftName}.${oneofSwiftName}`;
      const sanitizedSwiftName = sanitizeFieldName(swiftName);
      const oneofVariableCode = getOneofVariableCode();
      const oneofFieldCode = getOneofFieldCode();
      const oneofEquatableEnumCode = getOneofEquatableEnumCode();
      return [
        oneofVariableCode,
        oneofFieldCode,
        oneofEquatableEnumCode,
      ].join("");
      function getOneofVariableCode() {
        return `  public var ${sanitizedSwiftName}: ${oneofSwiftFullName}? = nil\n\n`;
      }
      function getOneofFieldCode() {
        return fields.map(
          ({ swiftName: fieldSwiftName, swiftType, schema }) => {
            if (schema.kind === "map") throw new Error("Unreachable error");
            return [
              `  public var ${fieldSwiftName}: ${swiftType} {\n`,
              `    get {\n`,
              `      if case .${fieldSwiftName}(let v)? = ${sanitizedSwiftName} {return v}\n`,
              `      return .init()\n`,
              `    }\n`,
              `    set {${sanitizedSwiftName} = .${fieldSwiftName}(newValue)}\n`,
              `  }\n\n`,
            ].join("");
          },
        ).join("");
      }
      function getOneofEquatableEnumCode() {
        return [
          `  public enum ${oneofSwiftName}: Equatable {\n`,
          ...fields.map(({ swiftName, swiftType }) => {
            return [
              `    case ${swiftName}(${swiftType})\n`,
            ].join("");
          }),
          "\n",
          `    #if !swift(>=4.1)\n`,
          `    public static func == (lhs: ${oneofSwiftFullName}, rhs: ${oneofSwiftFullName}) -> Bool {\n`,
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
    `  public static let protoMessageName: String = _protobuf_package + ".${
      config.typePath.split(".").pop()
    }"\n`,
    "  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = ",
  ];
  if (isGetEnumCodeConfig(config)) {
    const { enum: { fields } } = config;
    if (fields.length > 0) {
      buffer.push(
        "[\n",
        ...fields.map(([fieldNumber, { name }]) =>
          `    ${fieldNumber}: .same(proto: "${name}"),\n`
        ),
        "  ]\n",
      );
    } else {
      buffer.push("[:]\n");
    }
  } else {
    const { message: { schema: { fields: _fields } } } = config;
    const fields = Object.entries(_fields);
    if (fields.length > 0) {
      buffer.push(
        "[\n",
        ...fields.map((
          [fieldNumber, { name }],
        ) => `    ${fieldNumber}: .same(proto: "${name}"),\n`),
        "  ]\n",
      );
    } else {
      buffer.push("[:]\n");
    }
  }
  buffer.push(
    "}\n",
  );
  return buffer.join("");
};

const getDecodeMessageCode: GetCodeFn<GetMessageCodeConfig> = (config) => {
  const { getSwiftType } = config;
  return [
    `extension ${config.swiftFullName}: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {\n`,
    `  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {\n`,
    `    while let fieldNumber = try decoder.nextFieldNumber() {\n`,
    `      switch fieldNumber {\n`,
    ...config.message.fields.map(
      ({
        fieldNumber,
        swiftName,
        swiftProtobufType,
        schema,
        isMessage,
      }) => {
        const isRepeated = schema.kind === "repeated";
        if (schema.kind === "map") {
          const swiftKeyType = getSwiftType(schema.keyTypePath);
          const swiftValueType = getSwiftType(schema.valueTypePath);
          const swiftValueName = getSwiftFullName({
            schema: config.schema,
            typePath: schema.valueTypePath,
          });
          const valueKind = config.schema.types[schema.valueTypePath!]?.kind;
          if (valueKind === "message") {
            return [
              `      case ${fieldNumber}: try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.Protobuf${swiftKeyType}, ${swiftValueName}>.self, value: &self.${swiftName})\n`,
            ].join("");
          }
          if (valueKind === "enum") {
            return [
              `      case ${fieldNumber}: try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufEnumMap<SwiftProtobuf.Protobuf${swiftKeyType}, ${swiftValueName}>.self, value: &self.${swiftName})\n`,
            ].join("");
          }
          return [
            `      case ${fieldNumber}: try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.Protobuf${swiftKeyType}, SwiftProtobuf.Protobuf${swiftValueType}>.self, value: &self.${swiftName})\n`,
          ].join("");
        }
        return [
          `      case ${fieldNumber}: try decoder.decode${
            isRepeated ? "Repeated" : "Singular"
          }${swiftProtobufType}Field(value: &self.${
            !isRepeated && isMessage ? "_" : ""
          }${swiftName})\n`,
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
          swiftProtobufType,
          isMessage,
        }) => {
          const sanitizedParentSwiftName = sanitizeFieldName(parentSwiftName);
          if (isMessage) {
            return [
              `      case ${fieldNumber}: try {\n`,
              `        var v: ${swiftType}?\n`,
              `        var hadOneofValue = false\n`,
              `        if let current = self.${sanitizedParentSwiftName} {\n`,
              `          hadOneofValue = true\n`,
              `          if case .${swiftName}(let m) = current {v = m}\n`,
              `        }\n`,
              `        try decoder.decodeSingular${swiftProtobufType}Field(value: &v)\n`,
              `        if let v = v {\n`,
              `          if hadOneofValue {try decoder.handleConflictingOneOf()}\n`,
              `          self.${sanitizedParentSwiftName} = .${swiftName}(v)\n`,
              `        }\n`,
              `      }()\n`,
            ].join("");
          }
          return [
            `      case ${fieldNumber}: try {\n`,
            `        var v: ${swiftType}?\n`,
            `        try decoder.decodeSingular${swiftProtobufType}Field(value: &v)\n`,
            `        if let v = v {\n`,
            `          if self.${sanitizedParentSwiftName} != nil {try decoder.handleConflictingOneOf()}\n`,
            `          self.${sanitizedParentSwiftName} = .${swiftName}(v)\n`,
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
  const { getSwiftType } = config;
  return [
    `extension ${config.swiftFullName} {\n`,
    `  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {\n`,
    ...config.message.fields.map(
      ({
        fieldNumber,
        swiftName,
        swiftProtobufType,
        schema,
        default: defaultValue,
        isEnum,
      }) => {
        const buffer: string[] = [];
        const isRepeated = schema.kind === "repeated";
        if (isRepeated) {
          buffer.push(
            `    if !self.${swiftName}.isEmpty {\n`,
            `      try visitor.visitRepeated${swiftProtobufType}Field(value: self.${swiftName}, fieldNumber: ${fieldNumber})\n`,
            `    }\n`,
          );
        } else if (schema.kind === "map") {
          const swiftKeyType = getSwiftType(schema.keyTypePath);
          const swiftValueType = getSwiftType(schema.valueTypePath);
          const swiftValueName = getSwiftFullName({
            schema: config.schema,
            typePath: schema.valueTypePath,
          });
          buffer.push(
            `    if !self.${swiftName}.isEmpty {\n`,
          );
          const valueKind = config.schema.types[schema.valueTypePath!]?.kind;
          if (valueKind === "message") {
            buffer.push(
              `      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.Protobuf${swiftKeyType}, ${swiftValueName}>.self, value: self.${swiftName}, fieldNumber: ${fieldNumber})\n`,
            );
          } else if (valueKind === "enum") {
            buffer.push(
              `      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufEnumMap<SwiftProtobuf.Protobuf${swiftKeyType}, ${swiftValueName}>.self, value: self.${swiftName}, fieldNumber: ${fieldNumber})\n`,
            );
          } else {
            buffer.push(
              `      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.Protobuf${swiftKeyType}, SwiftProtobuf.Protobuf${swiftValueType}>.self, value: self.${swiftName}, fieldNumber: ${fieldNumber})\n`,
            );
          }
          buffer.push(
            `    }\n`,
          );
        } else {
          if (swiftProtobufType === "Message") {
            buffer.push(
              `    try { if let v = self._${swiftName} {\n`,
              `      try visitor.visitSingularMessageField(value: v, fieldNumber: ${fieldNumber})\n`,
              `    } }()\n`,
            );
          } else {
            buffer.push(
              `    if self.${swiftName} != ${defaultValue} {\n`,
              `      try visitor.visitSingular${swiftProtobufType}Field(value: self.${swiftName}, fieldNumber: ${fieldNumber})\n`,
              `    }\n`,
            );
          }
        }
        return buffer.join("");
      },
    ),
    ...config.message.oneofFields.map(
      ({
        swiftName: parentSwiftName,
        fields,
      }) => {
        const sanitizedParentSwiftName = sanitizeFieldName(parentSwiftName);
        return [
          `    switch self.${sanitizedParentSwiftName} {\n`,
          fields.map(({
            fieldNumber,
            swiftName,
            swiftProtobufType,
          }) => {
            return [
              `    case .${swiftName}?: try {\n`,
              `      guard case .${swiftName}(let v)? = self.${sanitizedParentSwiftName} else { preconditionFailure() }\n`,
              `      try visitor.visitSingular${swiftProtobufType}Field(value: v, fieldNumber: ${fieldNumber})\n`,
              `    }()\n`,
            ].join("");
          }).join(""),
          `    default: break\n`,
          `    }\n`,
        ].join("");
      },
    ),
    `    try unknownFields.traverse(visitor: &visitor)\n`,
    `  }\n`,
    `}\n`,
  ].join("");
};

const getMessageOperatorCode: GetCodeFn<GetMessageCodeConfig> = (config) => {
  const { swiftFullName, message } = config;
  return [
    `extension ${swiftFullName} {\n`,
    `  public static func == (lhs: ${swiftFullName}, rhs: ${swiftFullName}) -> Bool {\n`,
    message.fields.map((field) => {
      const swiftName = `${
        field.isMessage && field.schema.kind !== "repeated" ? "_" : ""
      }${field.swiftName}`;
      return `    if lhs.${swiftName} != rhs.${swiftName} { return false }\n`;
    }).join(""),
    message.oneofFields.map((field) => {
      const swiftName = sanitizeFieldName(field.swiftName);
      return `    if lhs.${swiftName} != rhs.${swiftName} { return false }\n`;
    }).join(""),
    `    if lhs.unknownFields != rhs.unknownFields { return false }\n`,
    `    return true\n`,
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
          return `extension ${config.swiftFullName}.OneOf_${
            toCamelCase(swiftName, true)
          }: @unchecked Sendable {}\n`;
        }).join("")
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
  schema: schema.Schema;
  typePath?: string;
}
export function pbTypeToSwiftType({
  customTypeMapping,
  schema,
  typePath,
}: PbTypeToSwiftTypeConfig): string {
  if (!typePath) return "Unknown";
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
  if (typePath in customTypeMapping) {
    return customTypeMapping[typePath].swiftType;
  }
  return getSwiftFullName({ schema, typePath });
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
  ".int64": "0",
  ".uint32": "0",
  ".uint64": "0",
  ".sint32": "0",
  ".sint64": "0",
  ".fixed32": "0",
  ".fixed64": "0",
  ".sfixed32": "0",
  ".sfixed64": "0",
  ".bool": "false",
  ".string": "String()",
  ".bytes": "Data()",
};
const scalarSwiftProtobufTypeMapping: ScalarToCodeTable = {
  ".double": "Double",
  ".float": "Float",
  ".int32": "Int32",
  ".int64": "Int64",
  ".uint32": "UInt32",
  ".uint64": "UInt64",
  ".sint32": "SInt32",
  ".sint64": "SInt64",
  ".fixed32": "Fixed32",
  ".fixed64": "Fixed64",
  ".sfixed32": "SFixed32",
  ".sfixed64": "SFixed64",
  ".bool": "Bool",
  ".string": "String",
  ".bytes": "Bytes",
};
function isPackableType(protobufType: string) {
  const packableType = [
    "Double",
    "Float",
    "Int32",
    "Int64",
    "UInt32",
    "UInt64",
    "SInt32",
    "SInt64",
    "Fixed32",
    "Fixed64",
    "SFixed32",
    "SFixed64",
  ];
  return packableType.includes(protobufType);
}
