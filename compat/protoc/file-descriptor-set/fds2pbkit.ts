import {
  Enum,
  File,
  Import,
  Message,
  Schema,
  Service,
} from "../../../core/schema/model.ts";
import {
  DescriptorProto,
  EnumDescriptorProto,
  FileDescriptorProto,
  FileDescriptorSet,
  ServiceDescriptorProto,
} from "../../../generated/messages/google/protobuf/index.ts";
import {
  Type as FieldType,
} from "../../../generated/messages/google/protobuf/(FieldDescriptorProto)/index.ts";

export interface ConvertFileDescriptorSetToSchemaConfig {
  fileDescriptorSet: FileDescriptorSet;
}
export function convertFileDescriptorSetToSchema(
  { fileDescriptorSet }: ConvertFileDescriptorSetToSchemaConfig,
): Schema {
  const result: Schema = {
    files: {},
    types: {},
    extends: {}, // TODO
    services: {},
  };
  for (const fileDescriptor of fileDescriptorSet.file) {
    const importPath = fileDescriptor.name || "";
    const syntax = fileDescriptor.syntax === "proto2" ? "proto2" : "proto3";
    const file: File = {
      parseResult: undefined,
      importPath,
      syntax,
      package: fileDescriptor.package || "",
      imports: getImports(fileDescriptor),
      options: {}, // TODO
      typePaths: [],
      servicePaths: [], // TODO
    };
    result.files[importPath] = file;
    const packageTypePath = file.package ? "." + file.package : "";
    const { messageTypes, enumTypes } = createFileIterator(
      fileDescriptor,
      packageTypePath,
    );
    for (const [typePath, descriptor] of messageTypes()) {
      result.types[typePath] = getMessage(file, descriptor);
      file.typePaths.push(typePath);
    }
    for (const [typePath, descriptor] of enumTypes()) {
      result.types[typePath] = getEnum(file, descriptor);
      file.typePaths.push(typePath);
    }
    for (const descriptor of fileDescriptor.service) {
      const typePath = packageTypePath + "." + descriptor.name;
      result.services[typePath] = getService(file, descriptor);
      file.servicePaths.push(typePath);
    }
  }
  return result;
}

function getService(file: File, descriptor: ServiceDescriptorProto): Service {
  return {
    filePath: file.importPath,
    options: {}, // TODO
    description: {
      leading: [], // TODO
      trailing: [], // TODO
      leadingDetached: [], // TODO
    },
    rpcs: {}, // TODO
  };
}

function getMessage(file: File, descriptor: DescriptorProto): Message {
  return {
    kind: "message",
    filePath: file.importPath,
    options: {}, // TODO
    description: {
      leading: [], // TODO
      trailing: [], // TODO
      leadingDetached: [], // TODO
    },
    fields: Object.fromEntries(
      descriptor.field.map((field) => {
        const kind = field.proto3Optional
          ? "optional"
          : field.label === "LABEL_REPEATED"
          ? "repeated"
          : field.label === "LABEL_REQUIRED"
          ? "required"
          : field.label === "LABEL_OPTIONAL"
          ? "optional"
          : "normal"; // TODO: oneof, map
        const typePath = field.typeName || getFieldTypePath(field.type);
        const type = typePath;
        return [Number(field.number), {
          description: {
            leading: [], // TODO
            trailing: [], // TODO
            leadingDetached: [], // TODO
          },
          kind,
          name: String(field.name),
          options: {}, // TODO
          type,
          typePath,
        }];
      }),
    ),
    groups: {}, // TODO
    reservedFieldNumberRanges: [], // TODO
    reservedFieldNames: [], // TODO
    extensions: [], // TODO
  };
}

function getFieldTypePath(fieldType?: FieldType): string {
  switch (fieldType) {
    case "TYPE_DOUBLE":
      return ".double";
    case "TYPE_FLOAT":
      return ".float";
    case "TYPE_INT64":
      return ".int64";
    case "TYPE_UINT64":
      return ".uint64";
    case "TYPE_INT32":
      return ".int32";
    case "TYPE_FIXED64":
      return ".fixed64";
    case "TYPE_FIXED32":
      return ".fixed32";
    case "TYPE_BOOL":
      return ".bool";
    case "TYPE_STRING":
      return ".string";
    case "TYPE_BYTES":
      return ".bytes";
    case "TYPE_UINT32":
      return ".uint32";
    case "TYPE_SFIXED32":
      return ".sfixed32";
    case "TYPE_SFIXED64":
      return ".sfixed64";
    case "TYPE_SINT32":
      return ".sint32";
    case "TYPE_SINT64":
      return ".sint64";
    default:
      return "";
  }
}

function getEnum(file: File, descriptor: EnumDescriptorProto): Enum {
  return {
    kind: "enum",
    filePath: file.importPath,
    options: {}, // TODO
    description: {
      leading: [], // TODO
      trailing: [], // TODO
      leadingDetached: [], // TODO
    },
    fields: Object.fromEntries(
      descriptor.value.map((field) => [Number(field.number), {
        description: {
          leading: [], // TODO
          trailing: [], // TODO
          leadingDetached: [], // TODO
        },
        name: String(field.name),
        options: {}, // TODO
      }]),
    ),
  };
}

function getImports(fileDescriptor: FileDescriptorProto): Import[] {
  const result: Import[] = [];
  for (const importPath of fileDescriptor.dependency) {
    result.push({ kind: "", importPath, filePath: importPath });
  }
  for (const ref of fileDescriptor.publicDependency) {
    const importPath = fileDescriptor.dependency[ref];
    result.push({ kind: "public", importPath, filePath: importPath });
  }
  for (const ref of fileDescriptor.weakDependency) {
    const importPath = fileDescriptor.dependency[ref];
    result.push({ kind: "weak", importPath, filePath: importPath });
  }
  return result;
}

interface FileIterator {
  messageTypes(): Generator<[string, DescriptorProto]>;
  enumTypes(): Generator<[string, EnumDescriptorProto]>;
}
function createFileIterator(
  fileDescriptor: FileDescriptorProto,
  packageTypePath: string,
): FileIterator {
  let messageTypes: (readonly [string, DescriptorProto])[] = [];
  let enumTypes: (readonly [string, EnumDescriptorProto])[] = [];
  queueMessageTypes(packageTypePath, fileDescriptor.messageType);
  queueEnumTypes(packageTypePath, fileDescriptor.enumType);
  return {
    *messageTypes() {
      while (messageTypes.length) {
        const [typePath, type] = messageTypes.pop()!;
        queueMessageTypes(typePath, type.nestedType);
        queueEnumTypes(typePath, type.enumType);
        yield [typePath, type];
      }
    },
    *enumTypes() {
      for (const [typePath, type] of enumTypes) yield [typePath, type];
    },
  };
  function queueMessageTypes(
    typePath: string,
    descriptors: DescriptorProto[],
  ): void {
    messageTypes = messageTypes.concat(
      descriptors.map((type) => [typePath + "." + type.name, type] as const),
    );
  }
  function queueEnumTypes(
    typePath: string,
    descriptors: EnumDescriptorProto[],
  ): void {
    enumTypes = enumTypes.concat(
      descriptors.map((type) => [typePath + "." + type.name, type] as const),
    );
  }
}
