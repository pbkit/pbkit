import { Schema } from "../../schema/model.ts";

export interface GenConfig {
  includeParseResult?: boolean;
  space?: Parameters<typeof JSON.stringify>[2];
}
export default function gen(schema: Schema, config: GenConfig = {}): string {
  const { includeParseResult, space } = config;
  if (includeParseResult) return JSON.stringify(schema, null, space);
  const files = Object.fromEntries(
    Object.entries(schema.files).map(
      ([key, file]) => {
        const newFile = { ...file };
        delete newFile.parseResult;
        return [key, newFile];
      },
    ),
  );
  return JSON.stringify({ ...schema, files }, null, space);
}
