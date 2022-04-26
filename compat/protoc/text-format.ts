import { WireMessage, WireType } from "../../core/runtime/wire/index.ts";
import deserialize from "../../core/runtime/wire/deserialize.ts";
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
          if (!field.typePath) continue iter;
          // handle scalar
          const fieldType = schema.types[field.typePath];
          if (!fieldType) continue iter;
          switch (fieldType.kind) {
            case "message": {
              if (wireField.type !== WireType.LengthDelimited) continue iter;
              unknown = false;
              const { name, typePath } = field;
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
              if (wireField.type !== WireType.Varint) continue iter;
              const enumField = fieldType.fields[wireField.value[0]];
              if (!enumField) continue iter;
              unknown = false;
              printer.println(`${field.name}: ${enumField.name}`);
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
