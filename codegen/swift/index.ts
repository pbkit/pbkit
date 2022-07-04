import * as schema from "../../core/schema/model.ts";
import { CodeEntry } from "../index.ts";
import genMessages, { Field } from "./messages.ts";
import genServices from "./services.ts";
import {
  sanitizeEnumName,
  sanitizeMessageName,
  toCamelCase,
} from "./swift-protobuf/name.ts";

export type GenConfig = {
  messages: GenMessagesConfig;
  services: GenServicesConfig;
  customTypeMapping?: CustomTypeMapping;
};
export default function gen(
  schema: schema.Schema,
  config: GenConfig,
) {
  const { messages, services, customTypeMapping } = config;
  const units = [{ schema, messages, services }];
  return filterDuplicates(genAll({ units, customTypeMapping }));
}

export interface GenUnit {
  schema: schema.Schema;
  messages: GenMessagesConfig;
  services: GenServicesConfig;
}
export interface GenAllConfig {
  units: GenUnit[];
  customTypeMapping?: CustomTypeMapping;
}
async function* genAll(config: GenAllConfig) {
  const { units, customTypeMapping } = config;
  for await (const unit of units) {
    yield* genBuildUnit(unit, customTypeMapping);
  }
}

async function* genBuildUnit(
  unit: GenUnit,
  _customTypeMapping?: CustomTypeMapping,
): AsyncGenerator<CodeEntry> {
  const { schema } = unit;
  const messages = unit.messages;
  const services = unit.services;
  const customTypeMapping: CustomTypeMapping = {
    ..._customTypeMapping,
  };
  yield* genMessages(schema, {
    customTypeMapping,
    messages,
  });
  yield* genServices(schema, {
    customTypeMapping,
    services,
  });
}

export interface CustomTypeMapping {
  [typePath: string]: {
    swiftType: string;
  };
}

export interface GetFieldCodeFnConfig {
  filePath: string;
  field: Field;
}
export interface GetFieldCodeFn {
  (config: GetFieldCodeFnConfig): string | undefined;
}
export type GenRuntimeConfig = {
  iterRuntimeFiles: () => AsyncGenerator<CodeEntry>;
  outDir: string;
  packageName?: undefined;
} | {
  iterRuntimeFiles?: undefined;
  outDir?: undefined;
  packageName: string;
};
export interface GenMessagesConfig {
  outDir: string;
  typePaths?: `.${string}`[];
}
export interface GenServicesConfig {
  outDir: string;
  genTypes: ServiceType[];
  servicePaths?: `.${string}`[];
}
export type ServiceType = "grpc" | "wrp";

export function toSwiftName(typePath: string) {
  return typePath.split(".").slice(1).map((fragment) =>
    fragment.charAt(0).toUpperCase() + fragment.slice(1)
  ).join("_");
}

interface GetSwiftFullNameConfig {
  schema: schema.Schema;
  typePath?: string;
}
/**
 * Returns SwiftFullName of typePath.
 * @example .package.example.Nested.Something.Message -> Package_Example_Nested.Something.Message
 */
export function getSwiftFullName(
  config: { schema: schema.Schema; typePath: string },
): string;
export function getSwiftFullName(
  config: { schema: schema.Schema; typePath?: string },
): string | undefined;
export function getSwiftFullName(
  { schema, typePath }: GetSwiftFullNameConfig,
): string | undefined {
  if (!typePath) return;
  const { parentTypePath, relativeTypePath } = getTypePath({
    schema,
    typePath,
  });
  const sanitizedRelativeTypeName = (() => {
    const relativeType = schema.types[typePath];
    if (relativeType) {
      switch (relativeType.kind) {
        case "message":
          return sanitizeMessageName(toSwiftName(relativeTypePath));
        case "enum":
          return sanitizeEnumName(toSwiftName(relativeTypePath));
      }
    }
    return toSwiftName(relativeTypePath);
  })();
  // @TODO(hyp3rflow): Sanitize only message name, not just package path.
  if (!parentTypePath) {
    const fragments = relativeTypePath.split(".").slice(1);
    const result = fragments.map((fragment, index) =>
      fragments.length === index + 1
        ? fragment.charAt(0).toUpperCase() + fragment.slice(1)
        : toCamelCase(fragment, true)
    ).join("_");
    if (typePath.startsWith(".google.protobuf")) {
      return "SwiftProtobuf." + result;
    }
    return result;
  }
  return getSwiftFullName({ schema, typePath: parentTypePath }) +
    `.${sanitizedRelativeTypeName}`;
}

interface GetTypePathConfig {
  schema: schema.Schema;
  typePath: string;
}
export function getTypePath(
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

// @TODO(dups)

async function* filterDuplicates(
  codes: AsyncGenerator<CodeEntry>,
): AsyncGenerator<CodeEntry> {
  const filter = new Set<string>();
  for await (const [filePath, data] of codes) {
    if (filter.has(filePath)) continue;
    filter.add(filePath);
    yield [filePath, data];
  }
}
