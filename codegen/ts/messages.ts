import { StringReader } from "https://deno.land/std@0.122.0/io/mod.ts";
import { snakeToCamel } from "../../misc/case.ts";
import * as schema from "../../core/schema/model.ts";
import { unpackFns } from "../../core/runtime/wire/scalar.ts";
import { ScalarValueTypePath } from "../../core/runtime/scalar.ts";
import { join } from "../path.ts";
import { CodeEntry } from "../index.ts";
import {
  CustomTypeMapping,
  GenMessagesConfig,
  GetFieldCodeFn,
} from "./index.ts";
import {
  AddInternalImport,
  CreateImportBufferFn,
  ImportBuffer,
} from "./import-buffer.ts";
import { IndexBuffer } from "./index-buffer.ts";

export interface GenConfig {
  createImportBuffer: CreateImportBufferFn;
  indexBuffer: IndexBuffer;
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
}
export default function* gen(
  schema: schema.Schema,
  config: GenConfig,
): Generator<CodeEntry> {
  const {
    createImportBuffer,
    indexBuffer,
    customTypeMapping,
    messages,
  } = config;
  for (const [typePath, type] of Object.entries(schema.types)) {
    indexBuffer.reExport(
      getFilePath(typePath, messages, ""),
      "Type",
      typePath.split(".").pop()!,
    );
    switch (type.kind) {
      case "enum":
        yield* genEnum({ typePath, type, messages });
        continue;
      case "message":
        yield* genMessage({
          schema,
          typePath,
          type,
          createImportBuffer,
          customTypeMapping,
          messages,
        });
        continue;
    }
  }
}

export function getFilePath(
  typePath: string,
  messages: GenMessagesConfig,
  ext = ".ts",
): string {
  return join(
    messages.outDir,
    typePath
      .replace(/^\./, "")
      .replaceAll(".", "/")
      .replaceAll(/\b([A-Z][^/]*)\//g, "($1)/") + ext,
  );
}

const getTypeDefCodeBase = (
  { typePath }: { typePath: string },
  getTypeDefCodeFn: (typeName: string) => string,
): string => {
  const fragments = typePath.split(".");
  const typeName = fragments.pop()!;
  return [
    `export declare namespace $${fragments.join(".")} {\n`,
    getTypeDefCodeFn(typeName),
    `}\n`,
    `export type Type = $${typePath};\n`,
  ].join("");
};

interface GenEnumConfig {
  typePath: string;
  type: schema.Enum;
  messages: GenMessagesConfig;
}
function* genEnum(
  { typePath, type, messages }: GenEnumConfig,
): Generator<CodeEntry> {
  const filePath = getFilePath(typePath, messages);
  const fields = Object.entries<schema.EnumField>({
    "0": { description: "", name: "UNSPECIFIED", options: {} },
    ...type.fields,
  });
  yield [
    filePath,
    new StringReader([
      getTypeDefCodeBase({ typePath }, (typeName) => {
        return `  export type ${typeName} =\n${
          fields.map(([, { name }]) => `    | "${name}"`).join("\n")
        };\n`;
      }),
      "\n",
      `export const num2name = {\n${
        fields.map(
          ([fieldNumber, { name }]) => `  ${fieldNumber}: "${name}",`,
        ).join("\n")
      }\n} as const;\n\n`,
      `export const name2num = {\n${
        fields.map(
          ([fieldNumber, { name }]) => `  ${name}: ${fieldNumber},`,
        ).join("\n")
      }\n} as const;\n`,
    ].join("")),
  ];
}

interface Message {
  schema: schema.Message;
  collectionFieldNumbers: Set<number>;
  everyFieldNames: Map<number, string>;
  fields: Field[];
  oneofFields: OneofField[];
}
export interface Field {
  schema: schema.MessageField;
  fieldNumber: number;
  tsName: string;
  tsType: string;
  isEnum: boolean;
  default: string | undefined;
}
interface OneofField {
  tsName: string;
  fields: Field[];
}

const reservedNames = [
  "Type",
  "Uint8Array",
  "getDefaultValue",
  "createValue",
  "encodeBinary",
  "decodeBinary",
  "encodeJson",
  "decodeJson",
];

interface GenMessageConfig {
  schema: schema.Schema;
  typePath: string;
  type: schema.Message;
  createImportBuffer: CreateImportBufferFn;
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
}
function* genMessage({
  schema,
  typePath,
  type,
  createImportBuffer,
  customTypeMapping,
  messages,
}: GenMessageConfig): Generator<CodeEntry> {
  const filePath = getFilePath(typePath, messages);
  const importBuffer = createImportBuffer({
    reservedNames: [...reservedNames, typePath.split(".").pop()!],
  });
  type NonOneofMessageField = Exclude<schema.MessageField, schema.OneofField>;
  const schemaFields = Object.entries(type.fields);
  const schemaOneofFields = schemaFields.filter(
    ([, field]) => field.kind === "oneof",
  ) as [string, schema.OneofField][];
  const schemaNonOneofFields = schemaFields.filter(
    ([, field]) => field.kind !== "oneof",
  ) as [string, NonOneofMessageField][];
  const collections = schemaNonOneofFields.filter(
    ([, field]) => field.kind === "map" || field.kind === "repeated",
  );
  const collectionFieldNumbers = new Set(
    collections.map(([fieldNumber]) => +fieldNumber),
  );
  const everyFieldNames = new Map(
    schemaFields.map(
      ([fieldNumber, { name }]) => [+fieldNumber, snakeToCamel(name)],
    ),
  );
  const oneofFieldTable: { [oneof: string]: OneofField } = {};
  for (const schemaOneofField of schemaOneofFields) {
    const [, schemaField] = schemaOneofField;
    if (schemaField.kind !== "oneof") continue;
    const tsName = snakeToCamel(schemaField.oneof);
    const oneofField = oneofFieldTable[tsName] ?? { tsName, fields: [] };
    oneofField.fields.push(toField(schemaOneofField));
    oneofFieldTable[tsName] = oneofField;
  }
  const message: Message = {
    schema: type,
    collectionFieldNumbers,
    everyFieldNames,
    fields: schemaNonOneofFields.map(toField),
    oneofFields: Object.values(oneofFieldTable),
  };
  const getCodeConfig: GetCodeConfig = {
    typePath,
    filePath,
    importBuffer,
    message,
    messages,
    customTypeMapping,
  };
  const typeDefCode = getMessageTypeDefCode(getCodeConfig);
  const getDefaultValueCode = getGetDefaultValueCode(getCodeConfig);
  const createValueCode = getCreateValueCode(getCodeConfig);
  const encodeJsonCode = getEncodeJsonCode(getCodeConfig);
  const decodeJsonCode = getDecodeJsonCode(getCodeConfig);
  const encodeBinaryCode = getEncodeBinaryCode(getCodeConfig);
  const decodeBinaryCode = getDecodeBinaryCode(getCodeConfig);
  const importCode = importBuffer.getCode();
  yield [
    filePath,
    new StringReader(
      [
        importCode ? importCode + "\n" : "",
        typeDefCode,
        "\n" + getDefaultValueCode,
        "\n" + createValueCode,
        "\n" + encodeJsonCode,
        "\n" + decodeJsonCode,
        "\n" + encodeBinaryCode,
        "\n" + decodeBinaryCode,
      ].join(""),
    ),
  ];
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      tsName: snakeToCamel(field.name),
      tsType: getFieldTypeCode(field),
      isEnum: getFieldIsEnum(field),
      default: getFieldDefaultCode(field),
    };
  }
  function getFieldTypeCode(field: schema.MessageField): string {
    if (field.kind !== "map") return toTsType(field.typePath);
    const keyTypeName = toTsType(field.keyTypePath);
    const valueTypeName = toTsType(field.valueTypePath);
    return `Map<${keyTypeName}, ${valueTypeName}>`;
  }
  function getFieldIsEnum(field: schema.MessageField): boolean {
    if (field.kind === "map") return false;
    if (!field.typePath) return false;
    return schema.types[field.typePath]?.kind === "enum";
  }
  function getFieldDefaultCode(field: schema.MessageField): string | undefined {
    if (field.kind === "repeated") return "[]";
    if (field.kind === "map") return "new Map()";
    if (field.typePath! in scalarTypeDefaultValueCodes) {
      return scalarTypeDefaultValueCodes[field.typePath as ScalarValueTypePath];
    }
    const fieldType = schema.types[field.typePath!];
    if (fieldType?.kind === "enum") {
      return `"${fieldType.fields[0]?.name ?? "UNSPECIFIED"}"`;
    }
  }
  function toTsType(typePath?: string) {
    return pbTypeToTsType({
      customTypeMapping,
      addInternalImport: importBuffer.addInternalImport,
      messages,
      here: filePath,
      typePath,
    });
  }
}

interface GetCodeConfig {
  typePath: string;
  filePath: string;
  importBuffer: ImportBuffer;
  message: Message;
  messages: GenMessagesConfig;
  customTypeMapping: CustomTypeMapping;
}
type GetCodeFn = (config: GetCodeConfig) => string;

const getMessageTypeDefCode: GetCodeFn = (config) => {
  const { message } = config;
  const typeBodyCodes: string[] = [];
  if (message.fields.length) typeBodyCodes.push(getFieldsCode());
  if (message.oneofFields.length) typeBodyCodes.push(getOneofsCode());
  return getTypeDefCodeBase(config, (typeName) => {
    if (!typeBodyCodes.length) return `  export interface ${typeName} {}\n`;
    return `  export interface ${typeName} {\n${typeBodyCodes.join("")}  }\n`;
  });
  function getFieldsCode() {
    return message.fields.map((field) => {
      const nullable = (
        (field.default == null) ||
        (field.schema.kind === "optional")
      );
      const opt = nullable ? "?" : "";
      const arr = (field.schema.kind === "repeated") ? "[]" : "";
      return `    ${field.tsName}${opt}: ${field.tsType}${arr};\n`;
    }).join("");
  }
  function getOneofsCode() {
    return message.oneofFields.map((oneofField) => {
      return `    ${oneofField.tsName}?: (\n${
        oneofField.fields.map(
          (field) =>
            `      | { field: "${field.tsName}", value: ${field.tsType} }\n`,
        ).join("")
      }  );\n`;
    }).join("");
  }
};

const getGetDefaultValueCode: GetCodeFn = ({ typePath, message }) => {
  return [
    `export function getDefaultValue(): $${typePath} {\n`,
    "  return {\n",
    message.fields.map((field) => {
      if (!field.default) return `    ${field.tsName}: undefined,\n`;
      return `    ${field.tsName}: ${field.default},\n`;
    }).join(""),
    message.oneofFields.map(
      (field) => `    ${field.tsName}: undefined,\n`,
    ).join(""),
    "  };\n",
    "}\n",
  ].join("");
};

const getCreateValueCode: GetCodeFn = ({ typePath }) => {
  return [
    `export function createValue(partialValue: Partial<$${typePath}>): $${typePath} {`,
    `  return {`,
    `    ...getDefaultValue(),`,
    `    ...partialValue,`,
    `  };`,
    `}`,
    "",
  ].join("\n");
};

const getEncodeJsonCode: GetCodeFn = ({
  typePath,
  filePath,
  importBuffer,
  message,
  messages,
  customTypeMapping,
}) => {
  return [
    `export function encodeJson(value: $${typePath}): unknown {\n`,
    "  const result: any = {};\n",
    message.fields.map((field) => {
      const { tsName, schema } = field;
      if (schema.kind === "oneof") return "";
      const tsValueToJsonValueCode = getGetTsValueToJsonValueCode({
        customTypeMapping,
        schema,
        messages,
      })({ filePath, importBuffer, field });
      if (schema.kind === "repeated") {
        return [
          `  result.${tsName} = ${tsValueToJsonValueCode};\n`,
        ].join("");
      }
      return [
        `  if (value.${tsName} !== undefined) result.${tsName} = ${tsValueToJsonValueCode};\n`,
      ].join("");
    }).join(""),
    message.oneofFields.map(({ tsName, fields }) => {
      return [
        `  switch (value.${tsName}?.field) {\n`,
        fields.map((field) => {
          const tsValueToJsonValueCode = getGetTsValueToJsonValueCode({
            customTypeMapping,
            schema: field.schema,
            messages,
          })({
            filePath,
            importBuffer,
            field: { ...field, tsName: tsName + ".value" },
          });
          return [
            `    case "${field.tsName}": {\n`,
            `      result.${field.tsName} = ${tsValueToJsonValueCode};\n`,
            "      break;\n",
            "    }\n",
          ].join("");
        }).join(""),
        "  }\n",
      ].join("");
    }).join(""),
    "  return result;\n",
    "}\n",
  ].join("");
};

const getDecodeJsonCode: GetCodeFn = ({
  typePath,
  filePath,
  importBuffer,
  message,
  messages,
  customTypeMapping,
}) => {
  return [
    `export function decodeJson(value: any): $${typePath} {\n`,
    "  const result = getDefaultValue();\n",
    message.fields
      .map((field) => {
        const { tsName, schema } = field;
        if (schema.kind === "oneof") return "";
        const jsonValueToTsValueCode = getGetJsonValueToTsValueCode({
          customTypeMapping,
          schema,
          messages,
        })({ filePath, importBuffer, field });
        if (schema.kind === "repeated") {
          return [
            `  result.${tsName} = ${jsonValueToTsValueCode} ?? [];\n`,
          ].join("");
        }
        return [
          `  if (value.${tsName} !== undefined) result.${tsName} = ${jsonValueToTsValueCode};\n`,
        ].join("");
      })
      .join(""),
    message.oneofFields.map(({ tsName, fields }) => {
      return [
        fields.map((field) => {
          const jsonValueToTsValueCode = getGetJsonValueToTsValueCode({
            customTypeMapping,
            schema: field.schema,
            messages,
          })({ filePath, importBuffer, field });
          return [
            `  if (value.${field.tsName} !== undefined) result.${tsName} = {field: "${field.tsName}", value: ${jsonValueToTsValueCode}};\n`,
          ].join("");
        }).join(""),
      ];
    }).join(""),
    `  return result;\n`,
    "}\n",
  ].join("");
};

const getEncodeBinaryCode: GetCodeFn = ({
  typePath,
  filePath,
  importBuffer,
  message,
  messages,
  customTypeMapping,
}) => {
  const WireMessage = importBuffer.addRuntimeImport(
    filePath,
    "wire/index.ts",
    "WireMessage",
  );
  const serialize = importBuffer.addRuntimeImport(
    filePath,
    "wire/serialize.ts",
    "default",
    "serialize",
  );
  return [
    `export function encodeBinary(value: $${typePath}): Uint8Array {\n`,
    `  const result: ${WireMessage} = [];\n`,
    message.fields.map((field) => {
      const { fieldNumber, tsName, schema } = field;
      if (schema.kind === "oneof") return ""; // never
      const tsValueToWireValueCode = getGetTsValueToWireValueCode({
        customTypeMapping,
        schema,
        messages,
      })({ filePath, importBuffer, field });
      if (schema.kind === "map") {
        return [
          "  {\n",
          `    const fields = Object.entries(value.${tsName});\n`,
          "    for (const [key, value] of fields) {\n",
          "      result.push(\n",
          `        [${fieldNumber}, ${tsValueToWireValueCode}],\n`,
          "      );\n",
          "    }\n",
          "  }\n",
        ].join("");
      }
      if (schema.kind === "repeated") {
        return [
          `  for (const tsValue of value.${tsName}) {\n`,
          "    result.push(\n",
          `      [${fieldNumber}, ${tsValueToWireValueCode}],\n`,
          "    );\n",
          "  }\n",
        ].join("");
      }
      if (schema.kind === "optional") {
        return [
          `  if (value.${tsName} !== undefined) {\n`,
          `    const tsValue = value.${tsName};\n`,
          "    result.push(\n",
          `      [${fieldNumber}, ${tsValueToWireValueCode}],\n`,
          "    );\n",
          "  }\n",
        ].join("");
      }
      return [
        `  if (value.${tsName} !== undefined) {\n`,
        `    const tsValue = value.${tsName};\n`,
        "    result.push(\n",
        `      [${fieldNumber}, ${tsValueToWireValueCode}],\n`,
        "    );\n",
        "  }\n",
      ].join("");
    }).join(""),
    message.oneofFields.map(({ tsName, fields }) => {
      return [
        `  switch (value.${tsName}?.field) {\n`,
        fields.map((field) => {
          const tsValueToWireValueCode = getGetTsValueToWireValueCode({
            customTypeMapping,
            schema: field.schema,
            messages,
          })({ filePath, importBuffer, field });
          return [
            `    case "${field.tsName}": {\n`,
            `      const tsValue = value.${tsName}.value;\n`,
            "      result.push(\n",
            `        [${field.fieldNumber}, ${tsValueToWireValueCode}],\n`,
            "      );\n",
            "      break;\n",
            "    }\n",
          ].join("");
        }).join(""),
        "  }\n",
      ].join("");
    }).join(""),
    `  return ${serialize}(result);\n`,
    "}\n",
  ].join("");
};

const getDecodeBinaryCode: GetCodeFn = ({
  typePath,
  filePath,
  importBuffer,
  message,
  messages,
  customTypeMapping,
}) => {
  const deserialize = importBuffer.addRuntimeImport(
    filePath,
    "wire/deserialize.ts",
    "default",
    "deserialize",
  );
  return [
    message.oneofFields.length
      ? [
        "const fieldNames: Map<number, string> = new Map([\n",
        [...message.everyFieldNames].map(
          ([fieldNumber, name]) => `  [${fieldNumber}, "${name}"],\n`,
        ).join(""),
        "]);\n",
      ].join("")
      : "",
    message.oneofFields.length
      ? [
        "const oneofFieldNumbersMap: { [oneof: string]: Set<number> } = {\n",
        message.oneofFields.map(({ tsName, fields }) => {
          return [
            `  ${tsName}: new Set([`,
            fields.map(({ fieldNumber }) => fieldNumber).join(", "),
            "]),\n",
          ].join("");
        }).join(""),
        "};\n",
      ].join("")
      : "",
    message.oneofFields.length
      ? [
        "const oneofFieldNamesMap = {\n",
        message.oneofFields.map(({ tsName, fields }) => {
          return [
            `  ${tsName}: new Map([\n`,
            fields.map(({ fieldNumber, tsName }) =>
              `    [${fieldNumber}, "${tsName}" as const],\n`
            ).join(""),
            "  ]),\n",
          ].join("");
        }).join(""),
        "};\n",
      ].join("")
      : "",
    `export function decodeBinary(binary: Uint8Array): $${typePath} {\n`,
    "  const result = getDefaultValue();\n",
    `  const wireMessage = ${deserialize}(binary);\n`,
    // TODO: "For embedded message fields, the parser merges multiple instances of the same field"
    "  const wireFields = new Map(wireMessage);\n",
    message.oneofFields.length
      ? "  const wireFieldNumbers = Array.from(wireFields.keys()).reverse();\n"
      : "",
    message.fields.map((field) => {
      const { fieldNumber, tsName, schema } = field;
      const wireValueToTsValueCode = getGetWireValueToTsValueCode({
        customTypeMapping,
        schema,
        messages,
      })({ filePath, importBuffer, field });
      if (!wireValueToTsValueCode) return "";
      const isCollection = message.collectionFieldNumbers.has(fieldNumber);
      if (isCollection) {
        const typePath = (schema as schema.RepeatedField).typePath;
        const type = typePath?.slice(1);
        let wireValuesToTsValuesCode: string;
        if (type as keyof typeof unpackFns in unpackFns) {
          const unpackFns = importBuffer.addRuntimeImport(
            filePath,
            "wire/scalar.ts",
            "unpackFns",
          );
          wireValuesToTsValuesCode =
            `Array.from(${unpackFns}.${type}(wireValues))`;
        } else if (field.isEnum && typePath) {
          const unpackFns = importBuffer.addRuntimeImport(
            filePath,
            "wire/scalar.ts",
            "unpackFns",
          );
          const num2name = importBuffer.addInternalImport(
            filePath,
            getFilePath(typePath, messages),
            "num2name",
          );
          wireValuesToTsValuesCode =
            `Array.from(${unpackFns}.int32(wireValues)).map(num => ${num2name}[num as keyof typeof ${num2name}])`;
        } else {
          wireValuesToTsValuesCode =
            `wireValues.map((wireValue) => ${wireValueToTsValueCode}).filter(x => x !== undefined)`;
        }
        const value = schema.kind === "map"
          ? "new Map(value as any)"
          : "value as any";
        return [
          "  collection: {\n",
          `    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === ${fieldNumber}).map(([, wireValue]) => wireValue);\n`,
          `    const value = ${wireValuesToTsValuesCode};\n`,
          "    if (!value.length) break collection;\n",
          `    result.${tsName} = ${value};\n`,
          "  }\n",
        ].join("");
      } else {
        return [
          "  field: {\n",
          `    const wireValue = wireFields.get(${fieldNumber});\n`,
          "    if (wireValue === undefined) break field;\n",
          `    const value = ${wireValueToTsValueCode};\n`,
          "    if (value === undefined) break field;\n",
          `    result.${tsName} = value;\n`,
          "  }\n",
        ].join("");
      }
    }).join(""),
    message.oneofFields.map((field) => {
      const { tsName, fields } = field;
      const Field = importBuffer.addRuntimeImport(
        filePath,
        "wire/index.ts",
        "Field",
      );
      const wireValueToTsValueMapCode = [
        "{\n",
        fields.map((field) => {
          const { fieldNumber, schema } = field;
          const wireValueToTsValueCode = getGetWireValueToTsValueCode({
            customTypeMapping,
            schema,
            messages,
          })({ filePath, importBuffer, field }) || "undefined";
          return `      [${fieldNumber}](wireValue: ${Field}) { return ${wireValueToTsValueCode}; },\n`;
        }).join(""),
        "    }",
      ].join("");
      return [
        "  oneof: {\n",
        `    const oneofFieldNumbers = oneofFieldNumbersMap.${tsName};\n`,
        `    const oneofFieldNames = oneofFieldNamesMap.${tsName};\n`,
        "    const fieldNumber = wireFieldNumbers.find(v => oneofFieldNumbers.has(v));\n",
        "    if (fieldNumber == null) break oneof;\n",
        "    const wireValue = wireFields.get(fieldNumber);\n",
        `    const wireValueToTsValueMap = ${wireValueToTsValueMapCode};\n`,
        `    const value = (wireValueToTsValueMap[fieldNumber as keyof typeof wireValueToTsValueMap] as any)?.(wireValue!);\n`,
        "    if (value === undefined) break oneof;\n",
        `    result.${tsName} = { field: oneofFieldNames.get(fieldNumber)!, value: value as any };\n`,
        "  }\n",
      ].join("");
    }).join(""),
    "  return result;\n",
    "}\n",
  ].join("");
};

type NonMapMessageField = Exclude<schema.MessageField, schema.MapField>;

interface GetGetTsValueToWireValueCodeConfig {
  customTypeMapping: CustomTypeMapping;
  schema: schema.MessageField;
  messages: GenMessagesConfig;
}
function getGetTsValueToWireValueCode({
  customTypeMapping,
  schema,
  messages,
}: GetGetTsValueToWireValueCodeConfig): GetFieldCodeFn {
  const customTypeMappingItem = customTypeMapping[
    (schema as NonMapMessageField).typePath!
  ];
  return (
    customTypeMappingItem?.getTsValueToWireValueCode ??
      ((config) => getDefaultTsValueToWireValueCode({ ...config, messages }))
  );
}
export interface GetDefaultTsValueToWireValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
export function getDefaultTsValueToWireValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultTsValueToWireValueCodeConfig): string | undefined {
  const { schema } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return;
    const serialize = importBuffer.addRuntimeImport(
      filePath,
      "wire/serialize.ts",
      "default",
      "serialize",
    );
    const WireType = importBuffer.addRuntimeImport(
      filePath,
      "wire/index.ts",
      "WireType",
    );
    const keyTypePathCode = typePathToCode("key", keyTypePath);
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    const value = (
      `${serialize}([[1, ${keyTypePathCode}], [2, ${valueTypePathCode}]])`
    );
    return `{ type: ${WireType}.LengthDelimited as const, value: ${value} }`;
  }
  const { typePath } = schema;
  return typePathToCode("tsValue", typePath);
  function typePathToCode(tsValue: string, typePath?: string) {
    if (!typePath) return;
    if (typePath in scalarTypeMapping) {
      const tsValueToWireValueFns = importBuffer.addRuntimeImport(
        filePath,
        "wire/scalar.ts",
        "tsValueToWireValueFns",
      );
      return `${tsValueToWireValueFns}.${typePath.substr(1)}(${tsValue})`;
    }
    const WireType = importBuffer.addRuntimeImport(
      filePath,
      "wire/index.ts",
      "WireType",
    );
    if (field.isEnum) {
      const Long = importBuffer.addRuntimeImport(
        filePath,
        "Long.ts",
        "default",
        "Long",
      );
      const name2num = importBuffer.addInternalImport(
        filePath,
        getFilePath(typePath, messages),
        "name2num",
      );
      return `{ type: ${WireType}.Varint as const, value: new ${Long}(${name2num}[${tsValue} as keyof typeof ${name2num}]) }`;
    }
    const encodeBinary = importBuffer.addInternalImport(
      filePath,
      getFilePath(typePath, messages),
      "encodeBinary",
    );
    return `{ type: ${WireType}.LengthDelimited as const, value: ${encodeBinary}(${tsValue}) }`;
  }
}

interface GetGetTsValueToJsonValueCodeConfig {
  customTypeMapping: CustomTypeMapping;
  schema: schema.MessageField;
  messages: GenMessagesConfig;
}
function getGetTsValueToJsonValueCode({
  customTypeMapping,
  schema,
  messages,
}: GetGetTsValueToJsonValueCodeConfig): GetFieldCodeFn {
  const customTypeMappingItem =
    customTypeMapping[(schema as NonMapMessageField).typePath!];
  return (
    customTypeMappingItem?.getTsValueToJsonValueCode ??
      ((config) => getDefaultTsValueToJsonValueCode({ ...config, messages }))
  );
}

export interface GetDefaultTsValueToJsonValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
export function getDefaultTsValueToJsonValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultTsValueToJsonValueCodeConfig): string | undefined {
  const { schema, tsName } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return;
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    return `Object.fromEntries([...value.${tsName}.entries()].map(([key, value]) => [key, ${valueTypePathCode}]))`;
  }
  if (schema.kind === "repeated") {
    const { typePath } = schema;
    if (!typePath) return;
    const typePathCode = typePathToCode("value", typePath);
    return `value.${tsName}.map(value => ${typePathCode})`;
  }
  const { typePath } = schema;
  return typePathToCode("value." + tsName, typePath);
  function typePathToCode(tsName: string, typePath?: string) {
    if (!typePath) return;
    if (typePath in scalarTypeMapping) {
      const tsValueToJsonValueFns = importBuffer.addRuntimeImport(
        filePath,
        "json/scalar.ts",
        "tsValueToJsonValueFns",
      );
      return `${tsValueToJsonValueFns}.${typePath.substr(1)}(${tsName})`;
    }
    if (field.isEnum) {
      const tsValueToJsonValueFns = importBuffer.addRuntimeImport(
        filePath,
        "json/scalar.ts",
        "tsValueToJsonValueFns",
      );
      return `${tsValueToJsonValueFns}.enum(${tsName})`;
    }
    const encodeJson = importBuffer.addInternalImport(
      filePath,
      getFilePath(typePath, messages),
      "encodeJson",
    );
    return `${encodeJson}(${tsName})`;
  }
}

interface GetGetJsonValueToTsValueCodeConfig {
  customTypeMapping: CustomTypeMapping;
  schema: schema.MessageField;
  messages: GenMessagesConfig;
}
function getGetJsonValueToTsValueCode({
  customTypeMapping,
  schema,
  messages,
}: GetGetJsonValueToTsValueCodeConfig): GetFieldCodeFn {
  const customTypeMappingItem =
    customTypeMapping[(schema as NonMapMessageField).typePath!];
  return (
    customTypeMappingItem?.getJsonValueToTsValueCode ??
      ((config) => getDefaultJsonValueToTsValueCode({ ...config, messages }))
  );
}

export interface GetDefaultJsonValueToTsValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
export function getDefaultJsonValueToTsValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultJsonValueToTsValueCodeConfig): string | undefined {
  const { schema, tsName } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return;
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    return `Object.fromEntries([...value.${tsName}.entries()].map(([key, value]) => [key, ${valueTypePathCode}]))`;
  }
  if (schema.kind === "repeated") {
    const { typePath } = schema;
    if (!typePath) return;
    const typePathCode = typePathToCode("value", typePath);
    return `value.${tsName}?.map((value: any) => ${typePathCode})`;
  }
  const { typePath } = schema;
  return typePathToCode("value." + tsName, typePath);
  function typePathToCode(
    jsonValue: string,
    typePath?: string,
  ) {
    if (!typePath) return;
    const jsonValueToTsValueFns = importBuffer.addRuntimeImport(
      filePath,
      "json/scalar.ts",
      "jsonValueToTsValueFns",
    );
    if (typePath in scalarTypeMapping) {
      return `${jsonValueToTsValueFns}.${typePath.substr(1)}(${jsonValue})`;
    }
    if (field.isEnum) {
      return `${jsonValueToTsValueFns}.enum(${jsonValue}) as ${field.tsType}`;
    }
    const decodeJson = importBuffer.addInternalImport(
      filePath,
      getFilePath(typePath, messages),
      "decodeJson",
    );
    return `${decodeJson}(${jsonValue})`;
  }
}

interface GetGetWireValueToTsValueCodeConfig {
  customTypeMapping: CustomTypeMapping;
  schema: schema.MessageField;
  messages: GenMessagesConfig;
}
function getGetWireValueToTsValueCode({
  customTypeMapping,
  schema,
  messages,
}: GetGetWireValueToTsValueCodeConfig): GetFieldCodeFn {
  const customTypeMappingItem = customTypeMapping[
    (schema as NonMapMessageField).typePath!
  ];
  return (
    customTypeMappingItem?.getWireValueToTsValueCode ??
      ((config) => getDefaultWireValueToTsValueCode({ ...config, messages }))
  );
}
export interface GetDefaultWireValueToTsValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
export function getDefaultWireValueToTsValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultWireValueToTsValueCodeConfig): string | undefined {
  const { schema } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return;
    const deserialize = importBuffer.addRuntimeImport(
      filePath,
      "wire/deserialize.ts",
      "default",
      "deserialize",
    );
    const WireType = importBuffer.addRuntimeImport(
      filePath,
      "wire/index.ts",
      "WireType",
    );
    const keyTypePathCode = typePathToCode("key", keyTypePath);
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    return [
      "(() => { ",
      `if (wireValue.type !== ${WireType}.LengthDelimited) { return; } `,
      `const { 0: key, 1: value } = Object.fromEntries(${deserialize}(wireValue.value)); `,
      "if (key === undefined || value === undefined) return; ",
      `return [${keyTypePathCode}, ${valueTypePathCode}] as const;`,
      "})()",
    ].join("");
  }
  const { typePath } = schema;
  return typePathToCode("wireValue", typePath);
  function typePathToCode(wireValue: string, typePath?: string) {
    if (!typePath) return;
    if (typePath in scalarTypeMapping) {
      const wireValueToTsValueFns = importBuffer.addRuntimeImport(
        filePath,
        "wire/scalar.ts",
        "wireValueToTsValueFns",
      );
      return `${wireValueToTsValueFns}.${typePath.substr(1)}(${wireValue})`;
    }
    const WireType = importBuffer.addRuntimeImport(
      filePath,
      "wire/index.ts",
      "WireType",
    );
    if (field.isEnum) {
      const num2name = importBuffer.addInternalImport(
        filePath,
        getFilePath(typePath, messages),
        "num2name",
      );
      return `${wireValue}.type === ${WireType}.Varint ? ${num2name}[${wireValue}.value[0] as keyof typeof ${num2name}] : undefined`;
    }
    const decodeBinary = importBuffer.addInternalImport(
      filePath,
      getFilePath(typePath, messages),
      "decodeBinary",
    );
    return `${wireValue}.type === ${WireType}.LengthDelimited ? ${decodeBinary}(${wireValue}.value) : undefined`;
  }
}

export interface PbTypeToTsTypeConfig {
  customTypeMapping: CustomTypeMapping;
  addInternalImport: AddInternalImport;
  messages: GenMessagesConfig;
  here: string;
  typePath?: string;
}
export function pbTypeToTsType({
  customTypeMapping,
  addInternalImport,
  messages,
  here,
  typePath,
}: PbTypeToTsTypeConfig): string {
  if (!typePath) return "unknown";
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
  if (typePath in customTypeMapping) {
    return customTypeMapping[typePath].tsType;
  }
  const from = getFilePath(typePath, messages);
  const as = typePath.match(/[^.]+$/)?.[0]!;
  return addInternalImport(here, from, "Type", as);
}
type ScalarToCodeTable = { [typePath in ScalarValueTypePath]: string };
const scalarTypeMapping: ScalarToCodeTable = {
  ".double": "number",
  ".float": "number",
  ".int32": "number",
  ".int64": "string",
  ".uint32": "number",
  ".uint64": "string",
  ".sint32": "number",
  ".sint64": "string",
  ".fixed32": "number",
  ".fixed64": "string",
  ".sfixed32": "number",
  ".sfixed64": "string",
  ".bool": "boolean",
  ".string": "string",
  ".bytes": "Uint8Array",
};
const scalarTypeDefaultValueCodes: ScalarToCodeTable = {
  ".double": "0",
  ".float": "0",
  ".int32": "0",
  ".int64": '"0"',
  ".uint32": "0",
  ".uint64": '"0"',
  ".sint32": "0",
  ".sint64": '"0"',
  ".fixed32": "0",
  ".fixed64": '"0"',
  ".sfixed32": "0",
  ".sfixed64": '"0"',
  ".bool": "false",
  ".string": '""',
  ".bytes": "new Uint8Array()",
};

export interface GetWellKnownTypeMappingConfig {
  messages: GenMessagesConfig;
}
export function getWellKnownTypeMapping({
  messages,
}: GetWellKnownTypeMappingConfig): CustomTypeMapping {
  return {
    ".google.protobuf.BoolValue": {
      tsType: "boolean",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.BytesValue": {
      tsType: "Uint8Array",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.DoubleValue": {
      tsType: "number",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.FloatValue": {
      tsType: "number",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.Int32Value": {
      tsType: "number",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.Int64Value": {
      tsType: "string",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.NullValue": {
      tsType: "null",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        }) === "NULL_VALUE" ? null : undefined`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))("NULL_VALUE")`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.StringValue": {
      tsType: "string",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.UInt32Value": {
      tsType: "number",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
    ".google.protobuf.UInt64Value": {
      tsType: "string",
      getWireValueToTsValueCode(config) {
        return `(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return `((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return `value.${field.tsName}`;
      },
    },
  };
}
