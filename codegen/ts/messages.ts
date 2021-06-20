import { StringReader } from "https://deno.land/std@0.98.0/io/mod.ts";
import * as path from "https://deno.land/std@0.98.0/path/mod.ts";
import { snakeToCamel } from "../../misc/case.ts";
import * as schema from "../../core/schema/model.ts";
import { createTypePathTree } from "../../core/schema/type-path-tree.ts";
import { ScalarValueTypePath } from "../../core/runtime/scalar.ts";
import { CodeEntry } from "../index.ts";
import { CustomTypeMapping, GetWireValueToJsValueCodeFn } from "./index.ts";
import {
  AddInternalImport,
  createImportBuffer,
  ImportBuffer,
} from "./import-buffer.ts";
import genIndex from "./genIndex.ts";

export default function* gen(
  schema: schema.Schema,
  customTypeMapping: CustomTypeMapping,
): Generator<CodeEntry> {
  yield* genIndex({
    typePathTree: createTypePathTree(Object.keys(schema.types)),
    exists: (typePath) => typePath in schema.types,
    getIndexFilePath,
    getFilePath,
    itemIsExportedAs: "Type",
  });
  for (const [typePath, type] of Object.entries(schema.types)) {
    switch (type.kind) {
      case "enum":
        yield* genEnum(typePath, type);
        continue;
      case "message":
        yield* genMessage(schema, typePath, type, customTypeMapping);
        continue;
    }
  }
}

export function getIndexFilePath(typePath: string): string {
  return path.join("messages", typePath.replaceAll(".", "/"), "index.ts");
}

export function getFilePath(typePath: string): string {
  return path.join("messages", typePath.replaceAll(".", "/") + ".ts");
}

function* genEnum(typePath: string, type: schema.Enum): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const fields = Object.entries<schema.EnumField>({
    "0": { description: "", name: "UNSPECIFIED", options: {} },
    ...type.fields,
  });
  yield [
    filePath,
    new StringReader([
      `export type Type =\n${
        fields.map(([, { name }]) => `  | "${name}"`).join("\n")
      };\n\n`,
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
  name: string;
  type: string;
  isEnum: boolean;
  default: string | undefined;
}
interface OneofField {
  name: string;
  fields: Field[];
}

const reservedNames = ["Type", "Uint8Array", "decodeBinary"];
function* genMessage(
  schema: schema.Schema,
  typePath: string,
  type: schema.Message,
  customTypeMapping: CustomTypeMapping,
): Generator<CodeEntry> {
  const filePath = getFilePath(typePath);
  const importBuffer = createImportBuffer(reservedNames);
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
    const name = snakeToCamel(schemaField.oneof);
    const oneofField = oneofFieldTable[name] ?? { name, fields: [] };
    oneofField.fields.push(toField(schemaOneofField));
    oneofFieldTable[name] = oneofField;
  }
  const message: Message = {
    schema: type,
    collectionFieldNumbers,
    everyFieldNames,
    fields: schemaNonOneofFields.map(toField),
    oneofFields: Object.values(oneofFieldTable),
  };
  const getCodeConfig: GetCodeConfig = {
    filePath,
    importBuffer,
    message,
    customTypeMapping,
  };
  const typeDefCode = getMessageTypeDefCode(getCodeConfig);
  const getDefaultValueCode = getGetDefaultValueCode(getCodeConfig);
  const decodeBinaryCode = getDecodeBinaryCode(getCodeConfig);
  const importCode = importBuffer.getCode();
  yield [
    filePath,
    new StringReader([
      importCode ? importCode + "\n" : "",
      typeDefCode,
      "\n" + getDefaultValueCode,
      "\n" + decodeBinaryCode,
    ].join("")),
  ];
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      name: snakeToCamel(field.name),
      type: getFieldTypeCode(field),
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
    return pbTypeToTsType(
      customTypeMapping,
      importBuffer.addInternalImport,
      filePath,
      typePath,
    );
  }
}

interface GetCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  message: Message;
  customTypeMapping: CustomTypeMapping;
}
type GetCodeFn = (config: GetCodeConfig) => string;

const getMessageTypeDefCode: GetCodeFn = ({ message }) => {
  const typeBodyCodes: string[] = [];
  if (message.fields.length) typeBodyCodes.push(getFieldsCode());
  if (message.oneofFields.length) typeBodyCodes.push(getOneofsCode());
  if (!typeBodyCodes.length) return `export interface Type {}\n`;
  return `export interface Type {\n${typeBodyCodes.join("")}}\n`;
  function getFieldsCode() {
    return message.fields.map((field) => {
      const nullable = (
        (field.default == null) ||
        (field.schema.kind === "optional")
      );
      const opt = nullable ? "?" : "";
      const arr = (field.schema.kind === "repeated") ? "[]" : "";
      return `  ${field.name}${opt}: ${field.type}${arr};\n`;
    }).join("");
  }
  function getOneofsCode() {
    return message.oneofFields.map((oneofField) => {
      return `  ${oneofField.name}?: (\n${
        oneofField.fields.map(
          (field) => `    | { field: "${field.name}", value: ${field.type} }\n`,
        ).join("")
      }  );\n`;
    }).join("");
  }
};

const getGetDefaultValueCode: GetCodeFn = ({ message }) => {
  return [
    "export function getDefaultValue(): Type {\n",
    "  return {\n",
    message.fields.map((field) => {
      if (!field.default) return `    ${field.name}: undefined,\n`;
      return `    ${field.name}: ${field.default},\n`;
    }).join(""),
    message.oneofFields.map(
      (field) => `    ${field.name}: undefined,\n`,
    ).join(""),
    "  };\n",
    "}\n",
  ].join("");
};

const getDecodeBinaryCode: GetCodeFn = (
  { filePath, importBuffer, message, customTypeMapping },
) => {
  const deserialize = importBuffer.addInternalImport(
    filePath,
    "runtime/wire/deserialize",
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
        message.oneofFields.map(({ name, fields }) => {
          return [
            `  ${name}: new Set([`,
            fields.map(({ fieldNumber }) => fieldNumber).join(", "),
            "]),\n",
          ].join("");
        }).join(""),
        "};\n",
      ].join("")
      : "",
    "export function decodeBinary(binary: Uint8Array): Type {\n",
    "  const result = getDefaultValue();\n",
    `  const wireMessage = ${deserialize}(binary);\n`,
    "  const wireFields = new Map(wireMessage);\n",
    message.oneofFields.length
      ? "  const wireFieldNumbers = Array.from(wireFields.keys()).reverse();\n"
      : "",
    message.fields.map((field) => {
      const { fieldNumber, name, schema } = field;
      const isCollection = message.collectionFieldNumbers.has(fieldNumber);
      if (isCollection) {
        return [
          "  collection: {\n",
          `    const wireValue = wireMessage.filter(([fieldNumber]) => fieldNumber === ${fieldNumber});\n`,
          "    const value = todo(wireValue);\n",
          "    if (value === undefined) break collection;\n",
          `    result.${name} = value;\n`,
          "  }\n",
        ].join("");
      } else {
        const wireValueToJsValueCode = getGetWireValueToJsValueCode(
          customTypeMapping,
          schema,
        )(
          filePath,
          importBuffer,
          field,
        );
        if (!wireValueToJsValueCode) return "";
        return [
          "  field: {\n",
          `    const wireValue = wireFields.get(${fieldNumber});\n`,
          `    const value = ${wireValueToJsValueCode};\n`,
          "    if (value === undefined) break field;\n",
          `    result.${name} = value;\n`,
          "  }\n",
        ].join("");
      }
    }).join(""),
    message.oneofFields.map((field) => {
      const { name, fields } = field;
      const wireValueToJsValueCode = [
        "{\n",
        fields.map((field) => {
          const { fieldNumber, schema } = field;
          const wireValueToJsValueCode = getGetWireValueToJsValueCode(
            customTypeMapping,
            schema,
          )(
            filePath,
            importBuffer,
            field,
          ) || "undefined";
          return `      ${fieldNumber}(wireValue) { return ${wireValueToJsValueCode}; },\n`;
        }).join(""),
        "    }[fieldNumber]?.(wireValue)",
      ].join("");
      return [
        "  oneof: {\n",
        `    const oneofFieldNumbers = oneofFieldNumbersMap.${name};\n`,
        "    const fieldNumber = wireFieldNumbers.find(v => oneofFieldNumbers.has(v));\n",
        "    if (fieldNumber == null) break oneof;\n",
        "    const wireValue = wireFields.get(fieldNumber);\n",
        `    const value = ${wireValueToJsValueCode};\n`,
        "    if (value === undefined) break oneof;\n",
        `    result.${name} = { field: fieldNames[fieldNumber], value };\n`,
        "  }\n",
      ].join("");
    }).join(""),
    "  return result;\n",
    "}\n",
  ].join("");
};

type NonMapMessageField = Exclude<schema.MessageField, schema.MapField>;
function getGetWireValueToJsValueCode(
  customTypeMapping: CustomTypeMapping,
  schema: schema.MessageField,
): GetWireValueToJsValueCodeFn {
  return (
    customTypeMapping[(schema as NonMapMessageField).typePath!]
      ?.getWireValueToJsValueCode ?? getDefaultWireValueToJsValueCode
  );
}
export function getDefaultWireValueToJsValueCode(
  filePath: string,
  importBuffer: ImportBuffer,
  field: Field,
): string | undefined {
  const schema = field.schema as NonMapMessageField;
  const { typePath } = schema;
  if (!typePath) return;
  if (typePath in scalarTypeMapping) {
    const wireValueToJsValue = importBuffer.addInternalImport(
      filePath,
      "runtime/wire/scalar.ts",
      "wireValueToJsValue",
    );
    return `${wireValueToJsValue}.${typePath.substr(1)}(wireValue)`;
  }
  const WireType = importBuffer.addInternalImport(
    filePath,
    "runtime/wire/index.ts",
    "WireType",
  );
  if (field.isEnum) {
    const num2name = importBuffer.addInternalImport(
      filePath,
      getFilePath(typePath),
      "num2name",
    );
    return `wireValue.type === ${WireType}.Varint ? ${num2name}[wireValue.value[0]] : undefined`;
  }
  const decodeBinary = importBuffer.addInternalImport(
    filePath,
    getFilePath(typePath),
    "decodeBinary",
  );
  return `wireValue.type === ${WireType}.LengthDelimited ? ${decodeBinary}(wireValue.value) : undefined`;
}

export function pbTypeToTsType(
  customTypeMapping: CustomTypeMapping,
  addInternalImport: AddInternalImport,
  here: string,
  typePath?: string,
): string {
  if (!typePath) return "unknown";
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
  if (typePath in wellKnownTypeMapping) {
    return customTypeMapping[typePath].tsType;
  }
  const from = getFilePath(typePath);
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
export const wellKnownTypeMapping: CustomTypeMapping = {
  ".google.protobuf.BoolValue": {
    tsType: "boolean",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.BytesValue": {
    tsType: "Uint8Array",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.DoubleValue": {
    tsType: "number",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.FloatValue": {
    tsType: "number",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.Int32Value": {
    tsType: "number",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.Int64Value": {
    tsType: "string",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.NullValue": {
    tsType: "null",
    getWireValueToJsValueCode(...args) {
      return `(${
        getDefaultWireValueToJsValueCode(...args)
      }) === 0 ? null : undefined`;
    },
  },
  ".google.protobuf.StringValue": {
    tsType: "string",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.UInt32Value": {
    tsType: "number",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
  ".google.protobuf.UInt64Value": {
    tsType: "string",
    getWireValueToJsValueCode(...args) {
      return `(${getDefaultWireValueToJsValueCode(...args)})?.value`;
    },
  },
};
