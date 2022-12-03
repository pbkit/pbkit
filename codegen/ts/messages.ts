import { snakeToCamel } from "../../misc/case.ts";
import * as schema from "../../core/schema/model.ts";
import { unpackFns } from "../../core/runtime/wire/scalar.ts";
import { ScalarValueTypePath } from "../../core/runtime/scalar.ts";
import { join } from "../path.ts";
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
import {
  CodeFragment,
  Export,
  js,
  Module,
  ModuleFragment,
  ts,
} from "./code-fragment.ts";

export interface GenConfig {
  createImportBuffer: CreateImportBufferFn;
  indexBuffer: IndexBuffer;
  customTypeMapping: CustomTypeMapping;
  messages: GenMessagesConfig;
}
export default function* gen(
  schema: schema.Schema,
  config: GenConfig,
): Generator<Module> {
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
): ModuleFragment[] => {
  const fragments = typePath.split(".");
  const typeName = fragments.pop()!;
  return [
    new Export(
      "$",
      ts`declare namespace $${fragments.join(".")} {\n${
        getTypeDefCodeFn(typeName)
      }}`,
    ),
    new Export("Type", ts`type Type = $${typePath};`),
  ];
};

interface GenEnumConfig {
  typePath: string;
  type: schema.Enum;
  messages: GenMessagesConfig;
}
function* genEnum(
  { typePath, type, messages }: GenEnumConfig,
): Generator<Module> {
  const filePath = getFilePath(typePath, messages);
  const fields = Object.entries<schema.EnumField>({
    "0": {
      description: { leading: [], trailing: [], leadingDetached: [] },
      name: "UNSPECIFIED",
      options: {},
    },
    ...type.fields,
  });
  yield new Module(filePath)
    .add(getTypeDefCodeBase({ typePath }, (typeName) => {
      return `  export type ${typeName} =\n${
        fields.map(([, { name }]) => `    | "${name}"`).join("\n")
      };\n`;
    }))
    .export(
      "num2name",
      js`const num2name = {\n${
        fields.map(
          ([fieldNumber, { name }]) => `  ${fieldNumber}: "${name}",`,
        ).join("\n")
      }\n}${ts` as const`};`,
    )
    .export(
      "name2num",
      js`const name2num = {\n${
        fields.map(
          ([fieldNumber, { name }]) => `  ${name}: ${fieldNumber},`,
        ).join("\n")
      }\n}${ts` as const`};`,
    );
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
  tsType: CodeFragment;
  isEnum: boolean;
  default: CodeFragment | undefined;
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
}: GenMessageConfig): Generator<Module> {
  const filePath = getFilePath(typePath, messages);
  const importBuffer = createImportBuffer();
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
  yield new Module(
    filePath,
    importBuffer,
    [...reservedNames, typePath.split(".").pop()!],
  )
    .add(getMessageTypeDefCode(getCodeConfig))
    .add(getGetDefaultValueCode(getCodeConfig))
    .add(getCreateValueCode(getCodeConfig))
    .add(getEncodeJsonCode(getCodeConfig))
    .add(getDecodeJsonCode(getCodeConfig))
    .add(getEncodeBinaryCode(getCodeConfig))
    .add(getDecodeBinaryCode(getCodeConfig));
  function toField([fieldNumber, field]: [string, schema.MessageField]): Field {
    return {
      schema: field,
      fieldNumber: +fieldNumber,
      tsName: snakeToCamel(field.name),
      tsType: getFieldTypeCode(field),
      isEnum: getFieldValueIsEnum(field),
      default: getFieldDefaultCode(field),
    };
  }
  function getFieldTypeCode(field: schema.MessageField): CodeFragment {
    if (field.kind !== "map") return toTsType(field.typePath);
    const keyTypeName = toTsType(field.keyTypePath);
    const valueTypeName = toTsType(field.valueTypePath);
    return ts`Map<${keyTypeName}, ${valueTypeName}>`;
  }
  function getFieldValueIsEnum(field: schema.MessageField): boolean {
    const typePath = (field.kind === "map")
      ? field.valueTypePath
      : field.typePath;
    if (!typePath) return false;
    return schema.types[typePath]?.kind === "enum";
  }
  function getFieldDefaultCode(
    field: schema.MessageField,
  ): CodeFragment | undefined {
    if (field.kind === "repeated") return js`[]`;
    if (field.kind === "map") return js`new Map()`;
    if (field.typePath! in scalarTypeDefaultValueCodes) {
      return scalarTypeDefaultValueCodes[field.typePath as ScalarValueTypePath];
    }
    const fieldType = schema.types[field.typePath!];
    if (fieldType?.kind === "enum") {
      return js`"${fieldType.fields[0]?.name ?? "UNSPECIFIED"}"`;
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
type GetCodeFn = (config: GetCodeConfig) => ModuleFragment[];

const getMessageTypeDefCode: GetCodeFn = (config) => {
  const { message } = config;
  const typeBodyCodes: string[] = [];
  if (message.fields.length) typeBodyCodes.push(getFieldsCode());
  if (message.oneofFields.length) typeBodyCodes.push(getOneofsCode());
  return getTypeDefCodeBase(config, (typeName) => {
    if (!typeBodyCodes.length) return `  export type ${typeName} = {}\n`;
    return `  export type ${typeName} = {\n${typeBodyCodes.join("")}  }\n`;
  });
  function getFieldsCode() {
    return message.fields.map((field) => {
      const nullable = (
        (field.default == null) ||
        (field.schema.kind === "optional")
      );
      const opt = nullable ? "?" : "";
      const arr = (field.schema.kind === "repeated") ? "[]" : "";
      const isDeprecated = field.schema.options["deprecated"] ?? false;
      if (isDeprecated) {
        return `    /** @deprecated */\n    ${field.tsName}${opt}: ${field.tsType}${arr};\n`;
      }
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
    new Export(
      "getDefaultValue",
      js([
        js`function getDefaultValue()${ts`: $${typePath}`} {\n`,
        js`  return {\n`,
        js([
          ...message.fields.map((field) => {
            if (!field.default || field.schema.kind === "optional") {
              return js`    ${field.tsName}: undefined,\n`;
            }
            return js`    ${field.tsName}: ${field.default},\n`;
          }),
          ...message.oneofFields.map(
            (field) => js`    ${field.tsName}: undefined,\n`,
          ),
        ]),
        js`  };\n`,
        js`}`,
      ]),
    ),
  ];
};

const getCreateValueCode: GetCodeFn = ({ typePath }) => {
  return [
    new Export(
      "createValue",
      js([
        js`function createValue(partialValue${ts`: Partial<$${typePath}>`})${ts`: $${typePath}`} {\n`,
        js`  return {\n`,
        js`    ...getDefaultValue(),\n`,
        js`    ...partialValue,\n`,
        js`  };\n`,
        js`}`,
      ]),
    ),
  ];
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
    new Export(
      "encodeJson",
      js([
        js`function encodeJson(value${ts`: $${typePath}`})${ts`: unknown`} {\n`,
        js`  const result${ts`: any`} = {};\n`,
        ...message.fields.map((field) => {
          const { tsName, schema } = field;
          if (schema.kind === "oneof") return "";
          const tsValueToJsonValueCode = getGetTsValueToJsonValueCode({
            customTypeMapping,
            schema,
            messages,
          })({ filePath, importBuffer, field });
          if (schema.kind === "repeated") {
            return js`  result.${tsName} = ${tsValueToJsonValueCode!};\n`;
          }
          return js`  if (value.${tsName} !== undefined) result.${tsName} = ${tsValueToJsonValueCode!};\n`;
        }),
        ...message.oneofFields.map(({ tsName, fields }) =>
          js([
            js`  switch (value.${tsName}?.field) {\n`,
            ...fields.map((field) => {
              const tsValueToJsonValueCode = getGetTsValueToJsonValueCode({
                customTypeMapping,
                schema: field.schema,
                messages,
              })({
                filePath,
                importBuffer,
                field: { ...field, tsName: tsName + ".value" },
              });
              return js([
                js`    case "${field.tsName}": {\n`,
                js`      result.${field.tsName} = ${tsValueToJsonValueCode!};\n`,
                js`      break;\n`,
                js`    }\n`,
              ]);
            }),
            js`  }\n`,
          ])
        ),
        js`  return result;\n`,
        js`}`,
      ]),
    ),
  ];
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
    new Export(
      "decodeJson",
      js([
        js`function decodeJson(value${ts`: any`})${ts`: $${typePath}`} {\n`,
        js`  const result = getDefaultValue();\n`,
        ...message.fields
          .map((field) => {
            const { tsName, schema } = field;
            if (schema.kind === "oneof") return js``; // never
            const jsonValueToTsValueCode = getGetJsonValueToTsValueCode({
              customTypeMapping,
              schema,
              messages,
            })({ filePath, importBuffer, field });
            if (schema.kind === "repeated") {
              return js`  result.${tsName} = ${jsonValueToTsValueCode!} ?? [];\n`;
            }
            return js`  if (value.${tsName} !== undefined) result.${tsName} = ${jsonValueToTsValueCode!};\n`;
          }),
        ...message.oneofFields.map(({ tsName, fields }) =>
          js(fields.map((field) => {
            const jsonValueToTsValueCode = getGetJsonValueToTsValueCode({
              customTypeMapping,
              schema: field.schema,
              messages,
            })({ filePath, importBuffer, field });
            return js`  if (value.${field.tsName} !== undefined) result.${tsName} = {field: "${field.tsName}", value: ${jsonValueToTsValueCode!}};\n`;
          }))
        ),
        js`  return result;\n`,
        js`}`,
      ]),
    ),
  ];
};

const getEncodeBinaryCode: GetCodeFn = ({
  typePath,
  filePath,
  importBuffer,
  message,
  messages,
  customTypeMapping,
}) => {
  const WireMessage = importBuffer.addRuntimeImport({
    here: filePath,
    from: "wire/index.ts",
    item: "WireMessage",
    type: true,
  });
  const serialize = importBuffer.addRuntimeImport({
    here: filePath,
    from: "wire/serialize.ts",
    item: "default",
    as: "serialize",
  });
  return [
    new Export(
      "encodeBinary",
      js([
        js`function encodeBinary(value${ts`: $${typePath}`})${ts`: Uint8Array`} {\n`,
        js`  const result${ts`: ${WireMessage}`} = [];\n`,
        ...message.fields.map((field) => {
          const { fieldNumber, tsName, schema } = field;
          if (schema.kind === "oneof") return js``; // never
          const tsValueToWireValueCode = getGetTsValueToWireValueCode({
            customTypeMapping,
            schema,
            messages,
          })({ filePath, importBuffer, field });
          if (schema.kind === "map") {
            return js([
              js`  {\n`,
              js`    const fields = value.${tsName}.entries();\n`,
              js`    for (const [key, value] of fields) {\n`,
              js`      result.push(\n`,
              js`        [${fieldNumber}, ${tsValueToWireValueCode!}],\n`,
              js`      );\n`,
              js`    }\n`,
              js`  }\n`,
            ]);
          }
          if (schema.kind === "repeated") {
            return js([
              js`  for (const tsValue of value.${tsName}) {\n`,
              js`    result.push(\n`,
              js`      [${fieldNumber}, ${tsValueToWireValueCode!}],\n`,
              js`    );\n`,
              js`  }\n`,
            ]);
          }
          if (schema.kind === "optional") {
            return js([
              js`  if (value.${tsName} !== undefined) {\n`,
              js`    const tsValue = value.${tsName};\n`,
              js`    result.push(\n`,
              js`      [${fieldNumber}, ${tsValueToWireValueCode!}],\n`,
              js`    );\n`,
              js`  }\n`,
            ]);
          }
          return js([
            js`  if (value.${tsName} !== undefined) {\n`,
            js`    const tsValue = value.${tsName};\n`,
            js`    result.push(\n`,
            js`      [${fieldNumber}, ${tsValueToWireValueCode!}],\n`,
            js`    );\n`,
            js`  }\n`,
          ]);
        }),
        ...message.oneofFields.map(({ tsName, fields }) => {
          return js([
            js`  switch (value.${tsName}?.field) {\n`,
            ...fields.map((field) => {
              const tsValueToWireValueCode = getGetTsValueToWireValueCode({
                customTypeMapping,
                schema: field.schema,
                messages,
              })({ filePath, importBuffer, field });
              return js([
                js`    case "${field.tsName}": {\n`,
                js`      const tsValue = value.${tsName}.value;\n`,
                js`      result.push(\n`,
                js`        [${field.fieldNumber}, ${tsValueToWireValueCode!}],\n`,
                js`      );\n`,
                js`      break;\n`,
                js`    }\n`,
              ]);
            }),
            js`  }\n`,
          ]);
        }),
        js`  return ${serialize}(result);\n`,
        js`}`,
      ]),
    ),
  ];
};

const getDecodeBinaryCode: GetCodeFn = ({
  typePath,
  filePath,
  importBuffer,
  message,
  messages,
  customTypeMapping,
}) => {
  const deserialize = importBuffer.addRuntimeImport({
    here: filePath,
    from: "wire/deserialize.ts",
    item: "default",
    as: "deserialize",
  });
  return [
    message.oneofFields.length
      ? js([
        js`const fieldNames${ts`: Map<number, string>`} = new Map([\n`,
        ...Array.from(message.everyFieldNames).map(
          ([fieldNumber, name]) => js`  [${fieldNumber}, "${name}"],\n`,
        ),
        "]);\n",
        js`const oneofFieldNumbersMap${ts`: { [oneof: string]: Set<number> }`} = {\n`,
        ...message.oneofFields.map(({ tsName, fields }) =>
          js([
            js`  ${tsName}: new Set([`,
            fields.map(({ fieldNumber }) => fieldNumber).join(", "),
            js`]),\n`,
          ])
        ),
        "};\n",
        js`const oneofFieldNamesMap = {\n`,
        ...message.oneofFields.map(({ tsName, fields }) =>
          js([
            js`  ${tsName}: new Map([\n`,
            ...fields.map(({ fieldNumber, tsName }) =>
              js`    [${fieldNumber}, "${tsName}"${ts` as const`}],\n`
            ),
            js`  ]),\n`,
          ])
        ),
        js`};\n`,
      ])
      : js``,
    new Export(
      "decodeBinary",
      js([
        js`function decodeBinary(binary${ts`: Uint8Array`})${ts`: $${typePath}`} {\n`,
        js`  const result = getDefaultValue();\n`,
        js`  const wireMessage = ${deserialize}(binary);\n`,
        // TODO: "For embedded message fields, the parser merges multiple instances of the same field"
        js`  const wireFields = new Map(wireMessage);\n`,
        message.oneofFields.length
          ? js`  const wireFieldNumbers = Array.from(wireFields.keys()).reverse();\n`
          : js``,
        ...message.fields.map((field) => {
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
            const type = typePath?.slice(1)!;
            let wireValuesToTsValuesCode: CodeFragment;
            if (type as keyof typeof unpackFns in unpackFns) {
              const unpackFns = importBuffer.addRuntimeImport({
                here: filePath,
                from: "wire/scalar.ts",
                item: "unpackFns",
              });
              wireValuesToTsValuesCode =
                js`Array.from(${unpackFns}.${type}(wireValues))`;
            } else if (field.isEnum && typePath) {
              const unpackFns = importBuffer.addRuntimeImport({
                here: filePath,
                from: "wire/scalar.ts",
                item: "unpackFns",
              });
              const num2name = importBuffer.addInternalImport({
                here: filePath,
                from: getFilePath(typePath, messages),
                item: "num2name",
              });
              wireValuesToTsValuesCode =
                js`Array.from(${unpackFns}.int32(wireValues)).map(num => ${num2name}[num${ts` as keyof typeof ${num2name}`}])`;
            } else {
              wireValuesToTsValuesCode =
                js`wireValues.map((wireValue) => ${wireValueToTsValueCode}).filter(x => x !== undefined)`;
            }
            const value = schema.kind === "map"
              ? js`new Map(value${ts` as any`})`
              : js`value${ts` as any`}`;
            return js([
              js`  collection: {\n`,
              js`    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === ${fieldNumber}).map(([, wireValue]) => wireValue);\n`,
              js`    const value = ${wireValuesToTsValuesCode};\n`,
              js`    if (!value.length) break collection;\n`,
              js`    result.${tsName} = ${value};\n`,
              js`  }\n`,
            ]);
          } else {
            return js([
              js`  field: {\n`,
              js`    const wireValue = wireFields.get(${fieldNumber});\n`,
              js`    if (wireValue === undefined) break field;\n`,
              js`    const value = ${wireValueToTsValueCode};\n`,
              js`    if (value === undefined) break field;\n`,
              js`    result.${tsName} = value;\n`,
              js`  }\n`,
            ]);
          }
        }),
        ...message.oneofFields.map((field) => {
          const { tsName, fields } = field;
          const Field = importBuffer.addRuntimeImport({
            here: filePath,
            from: "wire/index.ts",
            item: "Field",
            type: true,
          });
          const wireValueToTsValueMapCode = js([
            js`{\n`,
            ...fields.map((field) => {
              const { fieldNumber, schema } = field;
              const wireValueToTsValueCode = getGetWireValueToTsValueCode({
                customTypeMapping,
                schema,
                messages,
              })({ filePath, importBuffer, field }) || js`undefined`;
              return js`      [${fieldNumber}](wireValue${ts`: ${Field}`}) { return ${wireValueToTsValueCode}; },\n`;
            }).join(``),
            js`    }`,
          ]);
          return js([
            js`  oneof: {\n`,
            js`    const oneofFieldNumbers = oneofFieldNumbersMap.${tsName};\n`,
            js`    const oneofFieldNames = oneofFieldNamesMap.${tsName};\n`,
            js`    const fieldNumber = wireFieldNumbers.find(v => oneofFieldNumbers.has(v));\n`,
            js`    if (fieldNumber == null) break oneof;\n`,
            js`    const wireValue = wireFields.get(fieldNumber);\n`,
            js`    const wireValueToTsValueMap = ${wireValueToTsValueMapCode};\n`,
            js`    const value = (wireValueToTsValueMap[fieldNumber${ts` as keyof typeof wireValueToTsValueMap`}]${ts` as any`})?.(wireValue${ts`!`});\n`,
            js`    if (value === undefined) break oneof;\n`,
            js`    result.${tsName} = { field: oneofFieldNames.get(fieldNumber)${ts`!`}, value: value${ts` as any`} };\n`,
            js`  }\n`,
          ]);
        }),
        js`  return result;\n`,
        js`}`,
      ]),
    ),
  ];
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
interface GetDefaultTsValueToWireValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
function getDefaultTsValueToWireValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultTsValueToWireValueCodeConfig): CodeFragment {
  const { schema } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return js``;
    const serialize = importBuffer.addRuntimeImport({
      here: filePath,
      from: "wire/serialize.ts",
      item: "default",
      as: "serialize",
    });
    const WireType = importBuffer.addRuntimeImport({
      here: filePath,
      from: "wire/index.ts",
      item: "WireType",
    });
    const keyTypePathCode = typePathToCode("key", keyTypePath);
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    const value = (
      `${serialize}([[1, ${keyTypePathCode}], [2, ${valueTypePathCode}]])`
    );
    return js`{ type: ${WireType}.LengthDelimited${ts` as const`}, value: ${value} }`;
  }
  const { typePath } = schema;
  return typePathToCode("tsValue", typePath);
  function typePathToCode(tsValue: string, typePath?: string): CodeFragment {
    if (!typePath) return js``;
    if (typePath in scalarTypeMapping) {
      const tsValueToWireValueFns = importBuffer.addRuntimeImport({
        here: filePath,
        from: "wire/scalar.ts",
        item: "tsValueToWireValueFns",
      });
      return js`${tsValueToWireValueFns}.${typePath.slice(1)}(${tsValue})`;
    }
    const WireType = importBuffer.addRuntimeImport({
      here: filePath,
      from: "wire/index.ts",
      item: "WireType",
    });
    if (field.isEnum) {
      const Long = importBuffer.addRuntimeImport({
        here: filePath,
        from: "Long.ts",
        item: "default",
        as: "Long",
      });
      const name2num = importBuffer.addInternalImport({
        here: filePath,
        from: getFilePath(typePath, messages),
        item: "name2num",
      });
      return js`{ type: ${WireType}.Varint${ts` as const`}, value: new ${Long}(${name2num}[${tsValue}${ts` as keyof typeof ${name2num}`}]) }`;
    }
    const encodeBinary = importBuffer.addInternalImport({
      here: filePath,
      from: getFilePath(typePath, messages),
      item: "encodeBinary",
    });
    return js`{ type: ${WireType}.LengthDelimited${ts` as const`}, value: ${encodeBinary}(${tsValue}) }`;
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
}: GetDefaultTsValueToJsonValueCodeConfig): CodeFragment | undefined {
  const { schema, tsName } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return;
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    return js`Object.fromEntries([...value.${tsName}.entries()].map(([key, value]) => [key, ${valueTypePathCode}]))`;
  }
  if (schema.kind === "repeated") {
    const { typePath } = schema;
    if (!typePath) return;
    const typePathCode = typePathToCode("value", typePath);
    return js`value.${tsName}.map(value => ${typePathCode})`;
  }
  const { typePath } = schema;
  return typePathToCode("value." + tsName, typePath);
  function typePathToCode(tsName: string, typePath?: string): CodeFragment {
    if (!typePath) return js``;
    if (typePath in scalarTypeMapping) {
      const tsValueToJsonValueFns = importBuffer.addRuntimeImport({
        here: filePath,
        from: "json/scalar.ts",
        item: "tsValueToJsonValueFns",
      });
      return js`${tsValueToJsonValueFns}.${typePath.slice(1)}(${tsName})`;
    }
    if (field.isEnum) {
      const tsValueToJsonValueFns = importBuffer.addRuntimeImport({
        here: filePath,
        from: "json/scalar.ts",
        item: "tsValueToJsonValueFns",
      });
      return js`${tsValueToJsonValueFns}.enum(${tsName})`;
    }
    const encodeJson = importBuffer.addInternalImport({
      here: filePath,
      from: getFilePath(typePath, messages),
      item: "encodeJson",
    });
    return js`${encodeJson}(${tsName})`;
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

interface GetDefaultJsonValueToTsValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
function getDefaultJsonValueToTsValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultJsonValueToTsValueCodeConfig): CodeFragment | undefined {
  const { schema, tsName } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return;
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    return js`Object.fromEntries([...value.${tsName}.entries()].map(([key, value]) => [key, ${valueTypePathCode}]))`;
  }
  if (schema.kind === "repeated") {
    const { typePath } = schema;
    if (!typePath) return;
    const typePathCode = typePathToCode("value", typePath);
    return js`value.${tsName}?.map((value${ts`: any`}) => ${typePathCode})`;
  }
  const { typePath } = schema;
  return typePathToCode("value." + tsName, typePath);
  function typePathToCode(
    jsonValue: string,
    typePath?: string,
  ): CodeFragment {
    if (!typePath) return js``;
    const jsonValueToTsValueFns = importBuffer.addRuntimeImport({
      here: filePath,
      from: "json/scalar.ts",
      item: "jsonValueToTsValueFns",
    });
    if (typePath in scalarTypeMapping) {
      return js`${jsonValueToTsValueFns}.${typePath.slice(1)}(${jsonValue})`;
    }
    if (field.isEnum) {
      if (schema.kind === "map") {
        return js`${jsonValueToTsValueFns}.enum(${jsonValue})`;
      } else {
        return js`${jsonValueToTsValueFns}.enum(${jsonValue})${ts` as ${field.tsType}`}`;
      }
    }
    const decodeJson = importBuffer.addInternalImport({
      here: filePath,
      from: getFilePath(typePath, messages),
      item: "decodeJson",
    });
    return js`${decodeJson}(${jsonValue})`;
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
interface GetDefaultWireValueToTsValueCodeConfig {
  filePath: string;
  importBuffer: ImportBuffer;
  field: Field;
  messages: GenMessagesConfig;
}
function getDefaultWireValueToTsValueCode({
  filePath,
  importBuffer,
  field,
  messages,
}: GetDefaultWireValueToTsValueCodeConfig): CodeFragment {
  const { schema } = field;
  if (schema.kind === "map") {
    const { keyTypePath, valueTypePath } = schema;
    if (!keyTypePath || !valueTypePath) return js``;
    const deserialize = importBuffer.addRuntimeImport({
      here: filePath,
      from: "wire/deserialize.ts",
      item: "default",
      as: "deserialize",
    });
    const WireType = importBuffer.addRuntimeImport({
      here: filePath,
      from: "wire/index.ts",
      item: "WireType",
    });
    const keyTypePathCode = typePathToCode("key", keyTypePath);
    const valueTypePathCode = typePathToCode("value", valueTypePath);
    return js([
      js`(() => { `,
      js`if (wireValue.type !== ${WireType}.LengthDelimited) { return; } `,
      js`const { 1: key, 2: value } = Object.fromEntries(${deserialize}(wireValue.value)); `,
      js`if (key === undefined || value === undefined) return; `,
      js`return [${keyTypePathCode}, ${valueTypePathCode}]${ts` as const`};`,
      js`})()`,
    ]);
  }
  const { typePath } = schema;
  return typePathToCode("wireValue", typePath);
  function typePathToCode(wireValue: string, typePath?: string): CodeFragment {
    if (!typePath) return js``;
    if (typePath in scalarTypeMapping) {
      const wireValueToTsValueFns = importBuffer.addRuntimeImport({
        here: filePath,
        from: "wire/scalar.ts",
        item: "wireValueToTsValueFns",
      });
      return js`${wireValueToTsValueFns}.${typePath.slice(1)}(${wireValue})`;
    }
    const WireType = importBuffer.addRuntimeImport({
      here: filePath,
      from: "wire/index.ts",
      item: "WireType",
    });
    if (field.isEnum) {
      const num2name = importBuffer.addInternalImport({
        here: filePath,
        from: getFilePath(typePath, messages),
        item: "num2name",
      });
      return js`${wireValue}.type === ${WireType}.Varint ? ${num2name}[${wireValue}.value[0]${ts` as keyof typeof ${num2name}`}] : undefined`;
    }
    const decodeBinary = importBuffer.addInternalImport({
      here: filePath,
      from: getFilePath(typePath, messages),
      item: "decodeBinary",
    });
    return js`${wireValue}.type === ${WireType}.LengthDelimited ? ${decodeBinary}(${wireValue}.value) : undefined`;
  }
}

export interface PbTypeToTsMessageTypeConfig {
  addInternalImport: AddInternalImport;
  messages: GenMessagesConfig;
  here: string;
  typePath?: string;
}
export function pbTypeToTsMessageType({
  addInternalImport,
  messages,
  here,
  typePath,
}: PbTypeToTsMessageTypeConfig): CodeFragment {
  if (!typePath) return ts`unknown`;
  const from = getFilePath(typePath, messages);
  const as = typePath.match(/[^.]+$/)?.[0]!;
  return ts([addInternalImport({ here, from, item: "Type", as, type: true })]);
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
}: PbTypeToTsTypeConfig): CodeFragment {
  if (!typePath) return ts`unknown`;
  if (typePath in scalarTypeMapping) {
    return scalarTypeMapping[typePath as keyof typeof scalarTypeMapping];
  }
  if (typePath in customTypeMapping) {
    return customTypeMapping[typePath].tsType;
  }
  const from = getFilePath(typePath, messages);
  const as = typePath.match(/[^.]+$/)?.[0]!;
  return ts([addInternalImport({ here, from, item: "Type", as, type: true })]);
}
type ScalarToCodeTable = { [typePath in ScalarValueTypePath]: CodeFragment };
const scalarTypeMapping: ScalarToCodeTable = {
  ".double": ts`number`,
  ".float": ts`number`,
  ".int32": ts`number`,
  ".int64": ts`string`,
  ".uint32": ts`number`,
  ".uint64": ts`string`,
  ".sint32": ts`number`,
  ".sint64": ts`string`,
  ".fixed32": ts`number`,
  ".fixed64": ts`string`,
  ".sfixed32": ts`number`,
  ".sfixed64": ts`string`,
  ".bool": ts`boolean`,
  ".string": ts`string`,
  ".bytes": ts`Uint8Array`,
};
const scalarTypeDefaultValueCodes: ScalarToCodeTable = {
  ".double": js`0`,
  ".float": js`0`,
  ".int32": js`0`,
  ".int64": js`"0"`,
  ".uint32": js`0`,
  ".uint64": js`"0"`,
  ".sint32": js`0`,
  ".sint64": js`"0"`,
  ".fixed32": js`0`,
  ".fixed64": js`"0"`,
  ".sfixed32": js`0`,
  ".sfixed64": js`"0"`,
  ".bool": js`false`,
  ".string": js`""`,
  ".bytes": js`new Uint8Array()`,
};

export interface GetWellKnownTypeMappingConfig {
  messages: GenMessagesConfig;
}
export function getWellKnownTypeMapping({
  messages,
}: GetWellKnownTypeMappingConfig): CustomTypeMapping {
  return {
    ".google.protobuf.BoolValue": {
      tsType: ts`boolean`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.BytesValue": {
      tsType: ts`Uint8Array`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.DoubleValue": {
      tsType: ts`number`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.FloatValue": {
      tsType: ts`number`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.Int32Value": {
      tsType: ts`number`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.Int64Value": {
      tsType: ts`string`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.NullValue": {
      tsType: ts`null`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        }) === "NULL_VALUE" ? null : undefined`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))("NULL_VALUE")`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.StringValue": {
      tsType: ts`string`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.UInt32Value": {
      tsType: ts`number`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
    ".google.protobuf.UInt64Value": {
      tsType: ts`string`,
      getWireValueToTsValueCode(config) {
        return js`(${
          getDefaultWireValueToTsValueCode({ ...config, messages })
        })?.value`;
      },
      getTsValueToWireValueCode(config) {
        const value = getDefaultTsValueToWireValueCode({ ...config, messages });
        return js`((tsValue) => (${value}))({ value: tsValue })`;
      },
      getTsValueToJsonValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
      getJsonValueToTsValueCode(config) {
        const { field } = config;
        return js`value.${field.tsName}`;
      },
    },
  };
}
