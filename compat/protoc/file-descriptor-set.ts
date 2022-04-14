import {
  Enum,
  File,
  Message,
  Schema,
  Service,
  Type,
} from "../../core/schema/model.ts";
import { Type as FileDescriptorSet } from "../../generated/messages/google/protobuf/FileDescriptorSet.ts";
import { Type as FileDescriptorProto } from "../../generated/messages/google/protobuf/FileDescriptorProto.ts";

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
      dependency: [], // TODO
      messageType: [], // TODO
      enumType: [], // TODO
      service: [], // TODO
      extension: [], // TODO
      options: undefined, // TODO
      sourceCodeInfo: undefined, // TODO
      publicDependency: [], // TODO
      weakDependency: [], // TODO
      syntax: file.syntax,
    };
    result.file.push(fileDescriptorProto);
  }
  return result;
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
    const children = childrenTable[typePath].map(
      (childTypePath) => typePathToTypeTree(childTypePath),
    );
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

function getServicesFromFile(schema: Schema, file: File): Service[] {
  const result: Service[] = [];
  for (const servicePath of file.servicePaths) {
    if (!(servicePath in schema.services)) continue;
    result.push(schema.services[servicePath]);
  }
  return result;
}
