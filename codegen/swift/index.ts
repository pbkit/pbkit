import * as schema from "../../core/schema/model.ts";
import { CodeEntry } from "../index.ts";
import { Field } from "./messages.ts";
import genMessages from "./messages.ts";

// @TODO(dups)
export type GenConfig = {
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
  customTypeMapping?: CustomTypeMapping;
};
export default function gen(
  schema: schema.Schema,
  config: GenConfig = {},
) {
  const { messages, services, customTypeMapping } = config;
  const units = [{ schema, messages, services }];
  return filterDuplicates(genAll({ units, customTypeMapping }));
}

export interface GenUnit {
  schema: schema.Schema;
  messages?: GenMessagesConfig;
  services?: GenServicesConfig;
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
  const messages = unit.messages ?? { outDir: "messages" };
  const services = unit.services ?? { outDir: "services" };
  const customTypeMapping: CustomTypeMapping = {
    // ...getWellKnownTypeMapping({ messages }),
    ..._customTypeMapping,
  };
  yield* genMessages(schema, {
    customTypeMapping,
    messages,
  });
  // yield* genServices(schema, {
  //   customTypeMapping,
  //   messages,
  //   services,
  // });
}

export interface CustomTypeMapping {
  [typePath: string]: {
    swiftType: string;
    getWireValueToSwiftValueCode: GetFieldCodeFn;
    getSwiftValueToWireValueCode: GetFieldCodeFn;
    getSwiftValueToJsonValueCode: GetFieldCodeFn;
    getJsonValueToSwiftValueCode: GetFieldCodeFn;
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
}
export interface GenServicesConfig {
  outDir: string;
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
