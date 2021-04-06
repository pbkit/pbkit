import { WireMessage, WireType } from "./index.ts";
import { encode } from "./varint.ts";

export default function serialize(wireMessage: WireMessage): Uint8Array {
  const result: Uint8Array[] = [];
  wireMessage.forEach(([fieldNumber, field]) => {
    result.push(encode((fieldNumber << 3) | field.type));
    switch (field.type) {
      case WireType.Varint:
        result.push(encode(field.value));
        break;
      case WireType.Fixed64:
        const [lo, hi] = field.value;
        result.push(new Uint8Array(new Uint32Array([lo, hi]).buffer));
        break;
      case WireType.LengthDelimited:
        result.push(encode(field.value.byteLength));
        result.push(field.value);
        break;
      case WireType.Fixed32:
        result.push(new Uint8Array(new Uint32Array([field.value]).buffer));
        break;
    }
  });
  return concat(result);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, value) => {
    return acc + value.byteLength;
  }, 0);
  const result = new Uint8Array(totalLength);
  arrays.reduce((acc, array) => {
    result.set(array, acc);
    return acc + array.byteLength;
  }, 0);
  return result;
}
