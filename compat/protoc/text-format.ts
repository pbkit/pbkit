import { WireMessage, WireType } from "../../core/runtime/wire/index.ts";
import deserialize from "../../core/runtime/wire/deserialize.ts";
import { Schema } from "../../core/schema/model.ts";

export interface TypeInfo {
  typePath: string;
  schema: Schema;
}

export function encode(wireMessage: WireMessage, typeInfo: TypeInfo): string {
  return ""; // TODO
}

export function encodeSchemaless(wireMessage: WireMessage): string {
  const printer = createPrinter();
  printUnknownFields(printer, wireMessage);
  return printer.finish();
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
