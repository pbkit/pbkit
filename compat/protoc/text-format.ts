import { Field, WireMessage, WireType } from "../../core/runtime/wire/index.ts";
import deserialize from "../../core/runtime/wire/deserialize.ts";
import {
  unpackFns,
  wireValueToTsValueFns,
} from "../../core/runtime/wire/scalar.ts";
import { Schema } from "../../core/schema/model.ts";

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
          const { name, type, typePath, kind } = field;
          if (!typePath) continue iter;
          if (scalarToStringTable[typePath]) {
            if (
              kind === "repeated" &&
              wireField.type === WireType.LengthDelimited &&
              type as keyof typeof unpackFns in unpackFns
            ) {
              const values = Array.from<number | string | boolean>(
                unpackFns[type as keyof typeof unpackFns]([
                  wireField,
                ]),
              ).filter((v) => v != null).map(String);
              for (const value of values) {
                printer.println(`${name}: ${value}`);
              }
            } else {
              const value = scalarToStringTable[typePath](wireField);
              if (value === undefined) continue iter;
              printer.println(`${name}: ${value}`);
            }
            unknown = false;
          }
          const fieldType = schema.types[typePath];
          if (!fieldType) continue iter;
          switch (fieldType.kind) {
            case "message": {
              if (wireField.type !== WireType.LengthDelimited) continue iter;
              unknown = false;
              printer.println(`${name} {`);
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
            case "enum": {
              if (
                kind === "repeated" &&
                wireField.type === WireType.LengthDelimited
              ) {
                const values = Array.from(unpackFns.int32([wireField])).map(
                  (v) => fieldType.fields[v],
                );
                for (const value of values) {
                  printer.println(`${name}: ${value.name}`);
                }
              } else {
                if (wireField.type !== WireType.Varint) continue iter;
                const enumField = fieldType.fields[wireField.value[0]];
                if (!enumField) continue iter;
                printer.println(`${name}: ${enumField.name}`);
              }
              unknown = false;
              break;
            }
          }
        }
      }
    } finally {
      if (unknown) unknownFields.push(item);
      unknown = true;
    }
  }
  if (unknownFields.length) printUnknownFields(printer, unknownFields);
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

interface ScalarToStringTable {
  [typePath: string]: (field: Field) => string | undefined;
}
const scalarToStringTable: ScalarToStringTable = {
  ".double": (v) => {
    const value = wireValueToTsValueFns.double(v);
    if (value === undefined) return;
    if (isNaN(value)) return "nan";
    return String(value);
  },
  ".float": (v) => {
    const value = wireValueToTsValueFns.float(v);
    if (value === undefined) return;
    if (isNaN(value)) return "nan";
    return String(value);
  },
  ".int32": (v) => {
    const value = wireValueToTsValueFns.int32(v);
    if (value === undefined) return;
    return String(value);
  },
  ".int64": (v) => {
    const value = wireValueToTsValueFns.int64(v);
    if (value === undefined) return;
    return String(value);
  },
  ".uint32": (v) => {
    const value = wireValueToTsValueFns.uint32(v);
    if (value === undefined) return;
    return String(value);
  },
  ".uint64": (v) => {
    const value = wireValueToTsValueFns.uint64(v);
    if (value === undefined) return;
    return String(value);
  },
  ".sint32": (v) => {
    const value = wireValueToTsValueFns.sint32(v);
    if (value === undefined) return;
    return String(value);
  },
  ".sint64": (v) => {
    const value = wireValueToTsValueFns.sint64(v);
    if (value === undefined) return;
    return String(value);
  },
  ".fixed32": (v) => {
    const value = wireValueToTsValueFns.fixed32(v);
    if (value === undefined) return;
    return String(value);
  },
  ".fixed64": (v) => {
    const value = wireValueToTsValueFns.fixed64(v);
    if (value === undefined) return;
    return String(value);
  },
  ".sfixed32": (v) => {
    const value = wireValueToTsValueFns.sfixed32(v);
    if (value === undefined) return;
    return String(value);
  },
  ".sfixed64": (v) => {
    const value = wireValueToTsValueFns.sfixed64(v);
    if (value === undefined) return;
    return String(value);
  },
  ".bool": (v) => {
    if (v.type !== WireType.Varint) return;
    return String(Boolean(v.value[0]));
  },
  ".string": (v) => {
    const value = wireValueToTsValueFns.string(v);
    if (value === undefined) return;
    return JSON.stringify(value);
  },
  ".bytes": (v) => {
    const value = wireValueToTsValueFns.bytes(v);
    if (value === undefined) return;
    return JSON.stringify(value);
  },
};

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
