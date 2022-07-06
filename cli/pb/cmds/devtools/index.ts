import { serve } from "https://deno.land/std@0.136.0/http/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import {
  disassembleZip,
  File,
  serveZipFiles,
} from "https://deno.land/x/zipland@v0.0.5/mod.ts";

interface Options {
  port: number;
  webviewPath?: string;
}

const command = new Command();
command
  .option(
    "-p, --port <port:number>",
    "Port for pbkit devtools server to listen on",
    { default: 8099 },
  )
  .option(
    "--webview-path <path:string>",
    "Specify path for pbkit devtools webview",
  )
  .description(
    "Start pbkit devtools server",
  )
  .action(async (options: Options) => {
    const { port, webviewPath } = options;
    const channel = createChannel();
    const file = await download(
      webviewPath ??
        "https://github.com/pbkit/pbkit-devtools/releases/download/v0.0.7/standalone-webview.zip",
    );
    const zip = await disassembleZip(file);
    serve(async (req) => {
      const pathname = new URL(req.url).pathname;
      switch (pathname) {
        case "/send": {
          channel.sender.postMessage(await req.text());
          return new Response("good", { status: 200 });
        }
        case "/connect": {
          const stream = new ReadableStream({
            start(controller) {
              channel.receiver.onmessage = function (message: MessageEvent) {
                const body = `data: ${message.data}\n\n`;
                controller.enqueue(body);
              };
            },
            cancel() {
              channel.receiver.close();
            },
          });
          return new Response(stream.pipeThrough(new TextEncoderStream()), {
            headers: { "content-type": "text/event-stream" },
          });
        }
      }
      if (!zip) throw new Deno.errors.NotFound();
      return serveZipFiles(req, zip, { fsRoot: "webview" });
    }, {
      port,
    });
  });
export default command;

function createChannel() {
  const channel = new MessageChannel();
  channel.port1.start();
  channel.port2.start();
  return { sender: channel.port1, receiver: channel.port2 };
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
      p.set(u8s.subarray(pointer, p.length));
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
          next -= offset;
          break;
        }
      }
      return Promise.resolve(pointer = next);
    },
    stat() {
      return Promise.resolve({
        size: u8s.length,
      });
    },
  };
}
