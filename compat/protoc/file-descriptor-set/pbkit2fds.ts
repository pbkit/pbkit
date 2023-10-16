import {
  Enum,
  File,
  Message,
  MessageField,
  Options,
  OptionValue,
  Schema,
  Service,
  Type,
} from "../../../core/schema/model.ts";
import {
  DescriptorProto,
  EnumDescriptorProto,
  EnumValueOptions,
  FieldDescriptorProto,
  FileDescriptorProto,
  FileDescriptorSet,
  MethodDescriptorProto,
  ServiceDescriptorProto,
  UninterpretedOption,
} from "../../../generated/messages/google/protobuf/index.ts";
import {
  Label as FieldLabel,
  Type as FieldType,
} from "../../../generated/messages/google/protobuf/(FieldDescriptorProto)/index.ts";
import { snakeToCamel, snakeToPascal } from "../../../misc/case.ts";
import {
  Type as OptimizeMode,
} from "../../../generated/messages/google/protobuf/(FileOptions)/OptimizeMode.ts";
import {
  Type as IdempotencyLevel,
} from "../../../generated/messages/google/protobuf/(MethodOptions)/IdempotencyLevel.ts";
import { Type as CType } from "../../../generated/messages/google/protobuf/(FieldOptions)/CType.ts";
import { Type as JSType } from "../../../generated/messages/google/protobuf/(FieldOptions)/JSType.ts";
import { Type as OptionRetention } from "../../../generated/messages/google/protobuf/(FieldOptions)/OptionRetention.ts";
import { Type as OptionTargetType } from "../../../generated/messages/google/protobuf/(FieldOptions)/OptionTargetType.ts";

export interface ConvertSchemaToFileDescriptorSetConfig {
  schema: Schema;
}
export function convertSchemaToFileDescriptorSet(
  { schema }: ConvertSchemaToFileDescriptorSetConfig,
): FileDescriptorSet {
  const result: FileDescriptorSet = { file: [] };
  for (const [filePath, file] of Object.entries(schema.files)) {
    const typeTreeArray = typePathsToTypeTreeArray(
      schema.types,
      file.typePaths,
    );
    const messageTypes = typeTreeArray.filter(isMessageTypeTree);
    const enumTypes = typeTreeArray.filter(isEnumTypeTree);
    const services = getServicesFromFile(schema, file);
    const options = fileDescriptorOptions(file.options);
    const fileDescriptorProto: FileDescriptorProto = {
      name: file.importPath,
      package: file.package,
      dependency: file.imports.map(({ importPath }) => importPath),
      messageType: messageTypes.map((messageType) =>
        convertMessageToDescriptorProto({ schema, filePath, messageType })
      ),
      enumType: enumTypes.map(convertEnumToEnumDescriptorProto),
      service: services.map(convertServiceToDescriptorProto),
      extension: [], // TODO
      options: optionsOrUndefined(options),
      sourceCodeInfo: undefined, // TODO
      publicDependency: file.imports.map(
        ({ kind }, index) => kind === "public" ? index : -1,
      ).filter((v) => v >= 0),
      weakDependency: [], // TODO
      syntax: file.syntax,
    };
    result.file.push(fileDescriptorProto);
  }
  return result;
}

function convertServiceToDescriptorProto(
  service: ServiceWithName,
): ServiceDescriptorProto {
  const methodDescriptorProtos: ServiceDescriptorProto["method"] = [];
  for (const [rpcName, rpc] of Object.entries(service.rpcs)) {
    const options = methodDescriptorOptions(rpc.options);
    const methodDescriptorProto: MethodDescriptorProto = {
      name: rpcName,
      inputType: rpc.reqType.typePath,
      outputType: rpc.resType.typePath,
      options: optionsOrUndefined(options),
      clientStreaming: rpc.reqType.stream,
      serverStreaming: rpc.resType.stream,
    };
    methodDescriptorProtos.push(methodDescriptorProto);
  }
  return {
    name: service.name,
    method: methodDescriptorProtos,
  };
}

interface ConvertMessageToDescriptorProtoConfig {
  schema: Schema;
  filePath: string;
  messageType: TypeTree<Message>;
}
function convertMessageToDescriptorProto(
  config: ConvertMessageToDescriptorProtoConfig,
): DescriptorProto {
  const { schema, filePath, messageType } = config;
  const name = messageType.baseName;
  const nestedTypes = messageType.children.filter(isMessageTypeTree);
  const enumTypes = messageType.children.filter(isEnumTypeTree);
  const fieldDescriptorProtos: DescriptorProto["field"] = [];
  const oneofMap = new Map<string, number>();
  for (const [fieldNumber, field] of Object.entries(messageType.type.fields)) {
    if (field.kind === "map") {
      const options = fieldDescriptorOptions(field.options);
      const entryTypeName = `${snakeToPascal(field.name)}Entry`;
      const entryTypePath = `${messageType.typePath}.${entryTypeName}`;
      const fieldDescriptorProto: FieldDescriptorProto = {
        name: field.name,
        extendee: undefined, // TODO
        number: Number(fieldNumber),
        label: getFieldLabel(field),
        type: getFieldType(schema, field),
        typeName: entryTypePath,
        defaultValue: "default" in field.options
          ? String(field.options["default"])
          : undefined,
        options: optionsOrUndefined(options),
        oneofIndex: undefined,
        jsonName: field.options["json_name"]?.toString() ??
          snakeToCamel(field.name),
        proto3Optional: undefined, // TODO
      };
      fieldDescriptorProtos.push(fieldDescriptorProto);
      nestedTypes.push({
        baseName: entryTypeName,
        typePath: entryTypePath,
        type: {
          kind: "message",
          filePath,
          description: {
            leading: [],
            trailing: [],
            leadingDetached: [],
          },
          options: {
            "map_entry": true,
          },
          fields: {
            1: {
              kind: "normal",
              name: "key",
              type: field.keyType,
              typePath: field.keyTypePath,
              options: {},
              description: {
                leading: [],
                trailing: [],
                leadingDetached: [],
              },
            },
            2: {
              kind: "normal",
              name: "value",
              type: field.valueType,
              typePath: field.valueTypePath,
              options: {},
              description: {
                leading: [],
                trailing: [],
                leadingDetached: [],
              },
            },
          },
          groups: {},
          reservedFieldNumberRanges: [],
          reservedFieldNames: [],
          extensions: [],
        },
        children: [],
      });
      continue;
    }
    const options = fieldDescriptorOptions(field.options);
    const fieldDescriptorProto: FieldDescriptorProto = {
      name: field.name,
      extendee: undefined, // TODO
      number: Number(fieldNumber),
      label: getFieldLabel(field),
      type: getFieldType(schema, field),
      typeName: field.typePath || field.type,
      defaultValue: "default" in field.options
        ? String(field.options["default"])
        : undefined,
      options: optionsOrUndefined(options),
      oneofIndex: undefined,
      jsonName: field.options["json_name"]?.toString() ??
        snakeToCamel(field.name),
      proto3Optional: undefined, // TODO
    };
    if (field.kind === "oneof") {
      if (!oneofMap.has(field.oneof)) oneofMap.set(field.oneof, oneofMap.size);
      fieldDescriptorProto.oneofIndex = oneofMap.get(field.oneof);
    }
    fieldDescriptorProtos.push(fieldDescriptorProto);
  }
  const oneofDecl: DescriptorProto["oneofDecl"] = Array.from(
    oneofMap.keys(),
  ).map(
    (name) => ({ name }),
  );
  const options = descriptorOptions(messageType.type.options);
  return {
    name,
    field: fieldDescriptorProtos,
    nestedType: nestedTypes.map(
      (messageType) =>
        convertMessageToDescriptorProto({ schema, filePath, messageType }),
    ),
    enumType: enumTypes.map(convertEnumToEnumDescriptorProto),
    extensionRange: [], // TODO
    extension: [], // TODO
    options: optionsOrUndefined(options),
    oneofDecl,
    reservedRange: [], // TODO
    reservedName: [], // TODO
  };
}

function getFieldLabel(field: MessageField): FieldLabel {
  switch (field.kind) {
    case "normal":
    case "oneof":
    case "optional":
      return "LABEL_OPTIONAL";
    case "required":
      return "LABEL_REQUIRED";
    case "map":
    case "repeated":
      return "LABEL_REPEATED";
    default:
      return "UNSPECIFIED";
  }
}

function getFieldType(schema: Schema, field: MessageField): FieldType {
  if (field.kind === "map") return "TYPE_MESSAGE"; // TODO
  if (!field.typePath) return "UNSPECIFIED";
  if (schema.types[field.typePath]) {
    switch (schema.types[field.typePath].kind) {
      case "message":
        return "TYPE_MESSAGE";
      case "enum":
        return "TYPE_ENUM";
    }
  }
  switch (field.typePath) {
    case ".double":
      return "TYPE_DOUBLE";
    case ".float":
      return "TYPE_FLOAT";
    case ".int64":
      return "TYPE_INT64";
    case ".uint64":
      return "TYPE_UINT64";
    case ".int32":
      return "TYPE_INT32";
    case ".fixed64":
      return "TYPE_FIXED64";
    case ".fixed32":
      return "TYPE_FIXED32";
    case ".bool":
      return "TYPE_BOOL";
    case ".string":
      return "TYPE_STRING";
    case ".bytes":
      return "TYPE_BYTES";
    case ".uint32":
      return "TYPE_UINT32";
    case ".sfixed32":
      return "TYPE_SFIXED32";
    case ".sfixed64":
      return "TYPE_SFIXED64";
    case ".sint32":
      return "TYPE_SINT32";
    case ".sint64":
      return "TYPE_SINT64";
    default:
      return "UNSPECIFIED";
  }
}

function convertEnumToEnumDescriptorProto(
  enumType: TypeTree<Enum>,
): EnumDescriptorProto {
  const name = enumType.baseName;
  const value: EnumDescriptorProto["value"] = [];
  for (const [fieldNumber, field] of Object.entries(enumType.type.fields)) {
    const name = field.name;
    const number = Number(fieldNumber);
    const options = enumValueOptions(field.options);
    value.push({ name, number, options: optionsOrUndefined(options) });
  }
  const options = enumDescriptorOptions(enumType.type.options);
  return {
    name,
    value,
    options: optionsOrUndefined(options),
    reservedRange: [], // TODO
    reservedName: [], // TODO
  };
}

interface TypeTree<T extends Type = Type> {
  baseName: string;
  typePath: string;
  type: T;
  children: TypeTree[];
}
function typePathsToTypeTreeArray(
  types: Schema["types"],
  typePaths: string[],
): TypeTree[] {
  const result: TypeTree[] = [];
  const typePathSet = new Set(typePaths);
  const roots = new Set<string>();
  const childrenTable: {
    [typePath: string]: string[] /* childTypePaths */;
  } = {};
  for (const typePath of typePathSet) {
    const parentTypePath = getParentTypePath(typePath);
    if (!parentTypePath || !typePathSet.has(parentTypePath)) {
      roots.add(typePath);
      continue;
    }
    const children = childrenTable[parentTypePath] ||= [];
    children.push(typePath);
  }
  function typePathToTypeTree(typePath: string): TypeTree {
    const type = types[typePath];
    const baseName = getBaseName(typePath);
    const children = childrenTable[typePath]?.map(
      (childTypePath) => typePathToTypeTree(childTypePath),
    ) ?? [];
    return { baseName, typePath, type, children };
  }
  for (const root of roots) result.push(typePathToTypeTree(root));
  return result;
}

function getBaseName(typePath: string): string {
  const lastDotIndex = typePath.lastIndexOf(".");
  if (lastDotIndex < 0) return typePath;
  return typePath.slice(lastDotIndex + 1);
}

function getParentTypePath(typePath: string): string | undefined {
  const lastDotIndex = typePath.lastIndexOf(".");
  if (lastDotIndex < 1) return undefined;
  return typePath.slice(0, lastDotIndex);
}

function isMessageTypeTree(typeTree: TypeTree): typeTree is TypeTree<Message> {
  return isMessageType(typeTree.type);
}

function isEnumTypeTree(typeTree: TypeTree): typeTree is TypeTree<Enum> {
  return isEnumType(typeTree.type);
}

function isMessageType<T extends Type>(type: Type): type is T {
  return type.kind === "message";
}

function isEnumType<T extends Type>(type: Type): type is T {
  return type.kind === "enum";
}

interface ServiceWithName extends Service {
  name: string;
}
function getServicesFromFile(schema: Schema, file: File): ServiceWithName[] {
  const result: ServiceWithName[] = [];
  for (const servicePath of file.servicePaths) {
    if (!(servicePath in schema.services)) continue;
    result.push({
      ...schema.services[servicePath],
      name: servicePath.split(".").pop() || "",
    });
  }
  return result;
}

type OptionsBase = { uninterpretedOption: UninterpretedOption[] };
function optionsOrUndefined<T extends OptionsBase>(options: T): T | undefined {
  const { uninterpretedOption, ...rest } = options;
  const countOfOption = uninterpretedOption.length +
    Object.values(rest).filter((x) => x !== undefined).length;
  return countOfOption === 0 ? undefined : options;
}

function booleanOptionValue(
  value: OptionValue | undefined,
): boolean | undefined {
  return value !== undefined ? Boolean(value) : value;
}

type RequiredOptional<T extends { [key: string]: any }> = {
  [key in keyof Required<T>]-?: T[key];
};
function fileDescriptorOptions(
  options: Options,
): RequiredOptional<NonNullable<FileDescriptorProto["options"]>> {
  const result: RequiredOptional<NonNullable<FileDescriptorProto["options"]>> =
    {
      javaPackage: options["java_package"]?.toString(),
      javaOuterClassname: options["java_outer_classname"]?.toString(),
      javaMultipleFiles: booleanOptionValue(
        options["java_multiple_files"],
      ),
      goPackage: options["go_package"]?.toString(),
      ccGenericServices: booleanOptionValue(
        options["cc_generic_services"],
      ),
      javaGenericServices: booleanOptionValue(
        options["java_generic_services"],
      ),
      pyGenericServices: booleanOptionValue(
        options["py_generic_services"],
      ),
      javaGenerateEqualsAndHash: booleanOptionValue(
        options["java_generate_equals_and_hash"],
      ),
      deprecated: booleanOptionValue(options["deprecated"]),
      javaStringCheckUtf8: booleanOptionValue(
        options["java_string_check_utf8"],
      ),
      ccEnableArenas: booleanOptionValue(options["cc_enable_arenas"]),
      objcClassPrefix: options["objc_class_prefix"]?.toString(),
      csharpNamespace: options["csharp_namespace"]?.toString(),
      swiftPrefix: options["swift_prefix"]?.toString(),
      phpClassPrefix: options["php_class_prefix"]?.toString(),
      phpNamespace: options["php_namespace"]?.toString(),
      phpGenericServices: booleanOptionValue(
        options["php_generic_services"],
      ),
      phpMetadataNamespace: options["php_metadata_namespace"]?.toString(),
      rubyPackage: options["ruby_package"]?.toString(),
      optimizeFor: getOptimizeMode(options["optimize_for"]),
      features: {}, // TODO
      uninterpretedOption: [], // TODO
    };
  return result;
  function getOptimizeMode(optimizeFor: OptionValue): OptimizeMode | undefined {
    switch (optimizeFor) {
      case "SPEED":
      case "CODE_SIZE":
      case "LITE_RUNTIME":
        return optimizeFor;
      default:
        return undefined;
    }
  }
}

function methodDescriptorOptions(
  options: Options,
): RequiredOptional<NonNullable<MethodDescriptorProto["options"]>> {
  const result: RequiredOptional<
    NonNullable<MethodDescriptorProto["options"]>
  > = {
    deprecated: booleanOptionValue(options["deprecated"]),
    idempotencyLevel: getIdempotencyLevel(options["idempotency_level"]),
    features: {}, // TODO
    uninterpretedOption: [], // TODO
  };
  return result;
  function getIdempotencyLevel(
    idempotencyLevel: OptionValue,
  ): IdempotencyLevel | undefined {
    switch (idempotencyLevel) {
      case "IDEMPOTENCY_UNKNOWN":
      case "NO_SIDE_EFFECTS":
      case "IDEMPOTENT":
        return idempotencyLevel;
      default:
        return undefined;
    }
  }
}

function fieldDescriptorOptions(
  options: Options,
): RequiredOptional<NonNullable<FieldDescriptorProto["options"]>> {
  const result: RequiredOptional<NonNullable<FieldDescriptorProto["options"]>> =
    {
      packed: booleanOptionValue(options["packed"]),
      deprecated: booleanOptionValue(options["deprecated"]),
      lazy: booleanOptionValue(options["lazy"]),
      weak: booleanOptionValue(options["weak"]),
      unverifiedLazy: booleanOptionValue(options["unverified_lazy"]),
      ctype: getCType(options["ctype"]),
      jstype: getJSType(options["jstype"]),
      debugRedact: booleanOptionValue(options["debug_redact"]),
      retention: getOptionRetention(options["retention"]),
      targets: [], // TODO
      editionDefaults: [], // TODO
      features: {}, // TODO
      uninterpretedOption: [], // TODO
    };
  return result;
  function getCType(ctype: OptionValue): CType | undefined {
    switch (ctype) {
      case "STRING":
      case "CORD":
      case "STRING_PIECE":
        return ctype;
      default:
        return undefined;
    }
  }
  function getJSType(jstype: OptionValue): JSType | undefined {
    switch (jstype) {
      case "JS_NORMAL":
      case "JS_STRING":
      case "JS_NUMBER":
        return jstype;
      default:
        return undefined;
    }
  }
  function getOptionRetention(
    retention: OptionValue,
  ): OptionRetention | undefined {
    switch (retention) {
      case "RETENTION_UNKNOWN":
      case "RETENTION_RUNTIME":
      case "RETENTION_SOURCE":
        return retention;
      default:
        return undefined;
    }
  }
  function getOptionTargetType(
    target: OptionValue,
  ): OptionTargetType | undefined {
    switch (target) {
      case "TARGET_TYPE_UNKNOWN":
      case "TARGET_TYPE_FILE":
      case "TARGET_TYPE_EXTENSION_RANGE":
      case "TARGET_TYPE_MESSAGE":
      case "TARGET_TYPE_FIELD":
      case "TARGET_TYPE_ONEOF":
      case "TARGET_TYPE_ENUM":
      case "TARGET_TYPE_ENUM_ENTRY":
      case "TARGET_TYPE_SERVICE":
      case "TARGET_TYPE_METHOD":
        return target;
      default:
        return undefined;
    }
  }
}

function enumDescriptorOptions(
  options: Options,
): RequiredOptional<NonNullable<EnumDescriptorProto["options"]>> {
  const result: RequiredOptional<NonNullable<EnumDescriptorProto["options"]>> =
    {
      allowAlias: booleanOptionValue(options["allow_alias"]),
      deprecated: booleanOptionValue(options["deprecated"]),
      deprecatedLegacyJsonFieldConflicts: undefined,
      features: {}, // TODO
      uninterpretedOption: [], // TODO
    };
  return result;
}

function enumValueOptions(
  options: Options,
): RequiredOptional<EnumValueOptions> {
  const result: RequiredOptional<EnumValueOptions> = {
    deprecated: booleanOptionValue(options["deprecated"]),
    features: {}, // TODO
    debugRedact: undefined,
    uninterpretedOption: [], // TODO
  };
  return result;
}

function descriptorOptions(
  options: Options,
): RequiredOptional<NonNullable<DescriptorProto["options"]>> {
  const result: RequiredOptional<NonNullable<DescriptorProto["options"]>> = {
    messageSetWireFormat: booleanOptionValue(
      options["message_set_wire_format"],
    ),
    noStandardDescriptorAccessor: booleanOptionValue(
      options["no_standard_descriptor_accessor"],
    ),
    deprecated: booleanOptionValue(options["deprecated"]),
    mapEntry: booleanOptionValue(options["map_entry"]),
    deprecatedLegacyJsonFieldConflicts: booleanOptionValue(
      options["deprecated_legacy_json_field_conflicts"],
    ),
    features: {}, // TODO
    uninterpretedOption: [], // TODO
  };
  return result;
}
