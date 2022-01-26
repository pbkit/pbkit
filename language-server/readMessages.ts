import { BufReader } from "https://deno.land/std@0.122.0/io/buffer.ts";
import { TextProtoReader } from "https://deno.land/std@0.122.0/textproto/mod.ts";

export interface Message {
  headers: Headers;
  body: Uint8Array;
}
export async function* readMessages(
  reader: Deno.Reader,
): AsyncGenerator<Message> {
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
