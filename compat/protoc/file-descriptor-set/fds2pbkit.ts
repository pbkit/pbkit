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
    fields: {}, // TODO
    groups: {}, // TODO
    reservedFieldNumberRanges: [], // TODO
    reservedFieldNames: [], // TODO
    extensions: [], // TODO
  };
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
    fields: {}, // TODO
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
