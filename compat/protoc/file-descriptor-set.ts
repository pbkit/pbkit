import {
  Enum,
  File,
  Message,
  MessageField,
  Schema,
  Service,
  Type,
} from "../../core/schema/model.ts";
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
} from "../../generated/messages/google/protobuf/index.ts";
import {
  Label as FieldLabel,
  Type as FieldType,
} from "../../generated/messages/google/protobuf/(FieldDescriptorProto)/index.ts";
import { snakeToCamel } from "../../misc/case.ts";

export interface ConvertSchemaToFileDescriptorSetConfig {
  schema: Schema;
}
export function convertSchemaToFileDescriptorSet(
  { schema }: ConvertSchemaToFileDescriptorSetConfig,
): FileDescriptorSet {
  const result: FileDescriptorSet = { file: [] };
  for (const file of Object.values(schema.files)) {
    const typeTreeArray = typePathsToTypeTreeArray(
      schema.types,
      file.typePaths,
    );
    const messageTypes = typeTreeArray.filter(isMessageTypeTree);
    const enumTypes = typeTreeArray.filter(isEnumTypeTree);
    const services = getServicesFromFile(schema, file);
    const fileDescriptorProto: FileDescriptorProto = {
      name: file.importPath,
      package: file.package,
      dependency: file.imports.map(({ importPath }) => importPath),
      messageType: messageTypes.map((messageType) =>
        convertMessageToDescriptorProto({ schema, messageType })
      ),
      enumType: enumTypes.map(convertEnumToEnumDescriptorProto),
      service: services.map((service) =>
        convertServiceToDescriptorProto({ service })
      ),
      extension: [], // TODO
      options: undefined, // TODO
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

interface ConvertServiceToDescriptorProtoConfig {
  service: ServicePair;
}
function convertServiceToDescriptorProto(
  config: ConvertServiceToDescriptorProtoConfig,
): ServiceDescriptorProto {
  const { service: [name, service] } = config;
  const methodDescriptorProtos: ServiceDescriptorProto["method"] = [];
  for (const [rpcName, rpc] of Object.entries(service.rpcs)) {
    const methodDescriptorProto: MethodDescriptorProto = {
      name: rpcName,
      inputType: rpc.reqType.typePath,
      outputType: rpc.resType.typePath,
      options: undefined, // TODO
      clientStreaming: rpc.reqType.stream,
      serverStreaming: rpc.resType.stream,
    };
    methodDescriptorProtos.push(methodDescriptorProto);
  }
  return {
    name,
    method: methodDescriptorProtos,
  };
}

interface ConvertMessageToDescriptorProtoConfig {
  schema: Schema;
  messageType: TypeTree<Message>;
}
function convertMessageToDescriptorProto(
  config: ConvertMessageToDescriptorProtoConfig,
): DescriptorProto {
  const { schema, messageType } = config;
  const name = messageType.baseName;
  const nestedTypes = messageType.children.filter(isMessageTypeTree);
  const enumTypes = messageType.children.filter(isEnumTypeTree);
  const fieldDescriptorProtos: DescriptorProto["field"] = [];
  const oneofMap = new Map<string, number>();
  for (const [fieldNumber, field] of Object.entries(messageType.type.fields)) {
    if (field.kind === "map") continue; // TODO
    const options: FieldDescriptorProto["options"] = {
      // TODO
      uninterpretedOption: [], // TODO
    };
    if ("deprecated" in field.options) {
      options.deprecated = Boolean(field.options["deprecated"]);
    }
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
  const options: DescriptorProto["options"] = {
    uninterpretedOption: [], // TODO
  };
  if ("message_set_wire_format" in messageType.type.options) {
    options.messageSetWireFormat = Boolean(
      messageType.type.options["message_set_wire_format"],
    );
  }
  if ("no_standard_descriptor_accessor" in messageType.type.options) {
    options.noStandardDescriptorAccessor = Boolean(
      messageType.type.options["no_standard_descriptor_accessor"],
    );
  }
  if ("deprecated" in messageType.type.options) {
    options.deprecated = Boolean(messageType.type.options["deprecated"]);
  }
  return {
    name,
    field: fieldDescriptorProtos,
    nestedType: nestedTypes.map(
      (messageType) => convertMessageToDescriptorProto({ schema, messageType }),
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
    const options: EnumValueOptions = {
      uninterpretedOption: [], // TODO
    };
    if ("deprecated" in field.options) {
      options.deprecated = Boolean(field.options.deprecated);
    }
    value.push({ name, number, options: optionsOrUndefined(options) });
  }
  const options: EnumDescriptorProto["options"] = {
    uninterpretedOption: [], // TODO
  };
  if ("allow_alias" in enumType.type.options) {
    options.allowAlias = Boolean(enumType.type.options["allow_alias"]);
  }
  if ("deprecated" in enumType.type.options) {
    options.deprecated = Boolean(enumType.type.options["deprecated"]);
  }
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

type ServicePair = [string, Service];
function getServicesFromFile(schema: Schema, file: File): ServicePair[] {
  const result: ServicePair[] = [];
  for (const servicePath of file.servicePaths) {
    if (!(servicePath in schema.services)) continue;
    result.push([servicePath.split(".").pop()!, schema.services[servicePath]]);
  }
  return result;
}

type OptionsBase = { uninterpretedOption: UninterpretedOption[] };
function optionsOrUndefined<T extends OptionsBase>(options: T): T | undefined {
  const { uninterpretedOption, ...rest } = options;
  const countOfOption = (
    uninterpretedOption.length +
    Object.values(rest).filter((x) => x !== undefined).length
  );
  return countOfOption === 0 ? undefined : options;
}
