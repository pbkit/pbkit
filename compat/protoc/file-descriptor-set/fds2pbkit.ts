import { Schema } from "../../../core/schema/model.ts";
import { FileDescriptorSet } from "../../../generated/messages/google/protobuf/index.ts";

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
  // TODO
  return result;
}
