import { File, Import, Schema } from "../../../core/schema/model.ts";
import {
  FileDescriptorProto,
  FileDescriptorSet,
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
    extends: {},
    services: {},
  };
  for (const fileDescriptor of fileDescriptorSet.file) {
    const importPath = fileDescriptor.name || "";
    const file: File = {
      parseResult: undefined,
      importPath,
      syntax: (fileDescriptor.syntax as "proto2") || "proto2",
      package: fileDescriptor.package || "",
      imports: getImports(fileDescriptor),
      options: {}, // TODO
      typePaths: [], // TODO
      servicePaths: [], // TODO
    };
    result.files[importPath] = file;
  }
  return result;
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
