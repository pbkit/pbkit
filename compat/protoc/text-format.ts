import { Field, WireMessage, WireType } from "../../core/runtime/wire/index.ts";
import deserialize from "../../core/runtime/wire/deserialize.ts";
import {
  unpackFns,
  wireValueToTsValueFns,
} from "../../core/runtime/wire/scalar.ts";
import { MessageField, Schema } from "../../core/schema/model.ts";

export interface TypeInfo {
  typePath: string;
  schema: Schema;
}

export function encode(wireMessage: WireMessage, typeInfo: TypeInfo): string {
  const printer = createPrinter();
  printFields(printer, wireMessage, typeInfo);
  return printer.finish();
}

export function encodeSchemaless(wireMessage: WireMessage): string {
  const printer = createPrinter();
  printUnknownFields(printer, wireMessage);
  return printer.finish();
}

function printFields(
  printer: Printer,
  wireMessage: WireMessage,
  typeInfo: TypeInfo,
) {
  const unknownFields: WireMessage = [];
  const { schema } = typeInfo;
  const type = schema.types[typeInfo.typePath];
  if (!type || type.kind === "enum") {
    return printUnknownFields(printer, wireMessage);
  }
  iter:
  for (const item of wireMessage) {
    let unknown = true;
    try {
      const [fieldNumber, wireField] = item;
      const field = type.fields[fieldNumber];
      if (!field) continue iter;
      switch (field.kind) {
        case "map": // TODO
          continue iter;
        default: {
          const { typePath } = field;
          if (!typePath) continue iter;
          const fieldType = schema.types[typePath];
          const kind = (
            fieldType
              ? fieldType.kind
              : scalarTypes.includes(typePath)
              ? "scalar"
              : "unknown"
          );
          switch (kind) {
            case "scalar":
            case "enum": {
              const type = field.type as keyof typeof unpackFns;
              const values = (
                kind === "scalar"
                  ? getScalarReprs<any>(
                    field.kind,
                    wireField,
                    unpackFns[type],
                    wireValueToTsValueFns[type],
                    (v) => scalarToString(typePath, v),
                  )
                  : getScalarReprs<number>(
                    field.kind,
                    wireField,
                    unpackFns.int32,
                    wireValueToTsValueFns.int32,
                    (enumValue) => fieldType.fields[enumValue].name,
                  )
              );
              if (!values) continue iter;
              unknown = false;
              for (const value of values) {
                printer.println(`${field.name}: ${value}`);
              }
              break;
            }
            case "message": {
              if (wireField.type !== WireType.LengthDelimited) continue iter;
              unknown = false;
              printer.println(`${field.name} {`);
              printer.indent();
              printFields(
                printer,
                deserialize(wireField.value),
                { schema, typePath },
              );
              printer.dedent();
              printer.println("}");
              break;
            }
          }
        }
      }
    } finally {
      if (unknown) unknownFields.push(item);
    }
  }
  if (unknownFields.length) printUnknownFields(printer, unknownFields);
}

function getScalarReprs<T>(
  kind: MessageField["kind"],
  wireField: Field,
  unpackFn: (wireValues: Iterable<Field>) => Iterable<T>,
  wireValueToTsValueFn: (wireField: Field) => T | undefined,
  stringify: (value: T) => string,
): string[] | undefined {
  if (kind === "repeated" && wireField.type === WireType.LengthDelimited) {
    return Array.from(unpackFn([wireField])).map(stringify) as string[];
  } else {
    const value = wireValueToTsValueFn(wireField);
    if (value === undefined) return;
    return [stringify(value)];
  }
}

function printUnknownFields(
  printer: Printer,
  wireMessage: WireMessage,
  recursionBudget: number = 10,
) {
  for (const [fieldNumber, field] of wireMessage) {
    switch (field.type) {
      case WireType.Varint: {
        printer.println(`${fieldNumber}: ${field.value.toString()}`);
        break;
      }
      case WireType.Fixed64: {
        const hex = BigInt(field.value.toString()).toString(16);
        printer.println(`${fieldNumber}: 0x${hex.padStart(16, "0")}`);
        break;
      }
      case WireType.LengthDelimited: {
        if (field.value.length === 0) {
          printer.println(`${fieldNumber}: ""`);
          break;
        }
        message:
        if (recursionBudget > 0) {
          let wireMessage;
          try {
            wireMessage = deserialize(field.value);
          } catch {
            break message;
          }
          printer.println(`${fieldNumber} {`);
          printer.indent();
          printUnknownFields(printer, wireMessage, recursionBudget - 1);
          printer.dedent();
          printer.println(`}`);
          break;
        }
        const textDecoder = new TextDecoder();
        const text = textDecoder.decode(field.value);
        printer.println(`${fieldNumber}: ${JSON.stringify(text)}`);
        break;
      }
      case WireType.StartGroup: {
        break; // TODO
      }
      case WireType.EndGroup: {
        break; // TODO
      }
      case WireType.Fixed32: {
        const hex = BigInt(field.value.toString()).toString(16);
        printer.println(`${fieldNumber}: 0x${hex.padStart(8, "0")}`);
        break;
      }
    }
  }
}

export function decode(text: string, typeInfo: TypeInfo): WireMessage {
  return []; // TODO
}

export function decodeSchemaless(text: string): WireMessage {
  return []; // TODO
}

const scalarTypes = [
  ".double",
  ".float",
  ".int32",
  ".int64",
  ".uint32",
  ".uint64",
  ".sint32",
  ".sint64",
  ".fixed32",
  ".fixed64",
  ".sfixed32",
  ".sfixed64",
  ".bool",
  ".string",
  ".bytes",
];
function scalarToString(typePath: string, value: any): string {
  switch (typePath) {
    case ".bool":
      return value ? "true" : "false";
    case ".double":
    case ".float": {
      if (isNaN(value)) return "nan";
      return String(value);
    }
    case ".string":
    case ".bytes": {
      return JSON.stringify(value);
    }
    default:
      return String(value);
  }
}

interface Printer {
  indent(): void;
  dedent(): void;
  println(text: string): void;
  finish(): string;
}
function createPrinter(): Printer {
  let i = 0;
  let buffer = "";
  return {
    indent: () => ++i,
    dedent: () => --i,
    println: (text) => buffer += `${"  ".repeat(i)}${text}\n`,
    finish: () => buffer,
  };
}
