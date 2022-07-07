import { Handler, Server } from "https://deno.land/std@0.136.0/http/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import {
  disassembleZip,
  File,
  serveZipFiles,
  ZipFiles,
} from "https://deno.land/x/zipland@v0.0.7/mod.ts";
import {
  createEventEmitter,
  EventEmitter,
  Off,
} from "../../../../core/runtime/async/event-emitter.ts";
import { open } from "../../../../misc/browser.ts";

interface Options {
  webviewZipUrl?: string;
}

const command = new Command();
command
  .option(
    "--webview-zip-url <url:string>",
    "Specify zip url for pbkit devtools webview",
  )
  .description("Start pbkit devtools server")
  .arguments("[port:number]")
  .action(async (options: Options, port: number = 0) => {
    const { webviewZipUrl } = options;
    const channel = createEventEmitter<{ message: string }>();
    const file = await download(
      webviewZipUrl ??
        "https://github.com/pbkit/pbkit-devtools/releases/download/v0.0.8/standalone-webview.zip",
    );
    const zip = await disassembleZip(file);
    if (!zip) throw new Error("Failed to read zip file.");
    const listener = Deno.listen({ port, transport: "tcp" });
    new Server({ handler: createHandler(channel, zip) }).serve(listener);
    const addr = listener.addr as Deno.NetAddr;
    const url = `http://${addr.hostname}:${addr.port}`;
    console.error(`Listening on ${url}`);
    open(url);
  });
export default command;

function createHandler(
  channel: EventEmitter<{ message: string }>,
  zip: ZipFiles,
): Handler {
  return async (req) => {
    const pathname = new URL(req.url).pathname;
    switch (pathname) {
      case "/send": {
        const message = await req.text();
        if (message.indexOf("\n") !== -1) {
          return new Response("Newline not allowed.", { status: 400 });
        } else {
          channel.emit("message", message);
          return new Response("Ok.", { status: 200 });
        }
      }
      case "/connect": {
        let off: Off;
        const stream = new ReadableStream({
          start(controller) {
            off = channel.on("message", (message) => {
              controller.enqueue(`data: ${message}\n\n`);
            });
          },
          cancel: () => off?.(),
        });
        return new Response(stream.pipeThrough(new TextEncoderStream()), {
          headers: { "content-type": "text/event-stream" },
        });
      }
    }
    return serveZipFiles(req, zip);
  };
}

async function download(url: string): Promise<File> {
  const download = await fetch(url);
  if (!download.ok) {
    throw new Error(download.statusText);
  }
  const arrayBuffer = await download.arrayBuffer();
  return createFile(arrayBuffer);
}

function createFile(arrayBuffer: ArrayBuffer): File {
  const u8s = new Uint8Array(arrayBuffer);
  let pointer = 0;
  return {
    read(p) {
      p.set(u8s.subarray(pointer, pointer += p.length));
      return Promise.resolve(p.length);
    },
    seek(offset, whence) {
      let next = pointer;
      switch (whence) {
        case Deno.SeekMode.Start: {
          next = offset;
          break;
        }
        case Deno.SeekMode.Current: {
          next += offset;
          break;
        }
        case Deno.SeekMode.End: {
          next = u8s.byteLength + offset;
          break;
        }
      }
      return Promise.resolve(pointer = next);
    },
    stat() {
      return Promise.resolve({
        size: u8s.byteLength,
      });
    },
  };
}
