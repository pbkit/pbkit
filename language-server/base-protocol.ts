import {
  BufReader,
  BufWriter,
} from "https://deno.land/std@0.147.0/io/buffer.ts";
import { TextProtoReader } from "https://deno.land/std@0.147.0/textproto/mod.ts";

export interface BaseProtocolMessage {
  headers: Headers;
  body: Uint8Array;
}
export async function* readBaseProtocolMessages(
  reader: Deno.Reader,
): AsyncGenerator<BaseProtocolMessage> {
  const bufReader = new BufReader(reader);
  const textProtoReader = new TextProtoReader(bufReader);
  while (true) {
    const headers = await textProtoReader.readMIMEHeader();
    if (headers === null) throw new Deno.errors.UnexpectedEof();
    const contentLength = headers.get("Content-Length");
    if (!contentLength) {
      throw new Error("Header must provide a Content-Length property.");
    }
    const length = parseInt(contentLength);
    if (isNaN(length)) {
      throw new Error("Content-Length value must be a number.");
    }
    const body = await bufReader.readFull(new Uint8Array(length));
    if (!body) throw new Deno.errors.UnexpectedEof();
    yield { headers, body };
  }
}

const textEncoder = new TextEncoder();
export async function writeBaseProtocolMessage(
  writer: Deno.Writer,
  body: Uint8Array,
  headers: Headers = new Headers(),
): Promise<void> {
  const bufWriter = new BufWriter(writer);
  await bufWriter.write(
    textEncoder.encode(`Content-Length: ${body.length}\r\n`),
  );
  await bufWriter.write(textEncoder.encode(
    Array.from(headers.entries()).map(
      ([key, value]) => `${key}: ${value}\r\n`,
    ).join("") + "\r\n",
  ));
  await bufWriter.write(body);
  await bufWriter.flush();
}
