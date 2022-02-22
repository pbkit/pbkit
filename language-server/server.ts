import { getVendorDir } from "../cli/pb/config.ts";
import { createLoader } from "../core/loader/deno-fs.ts";
import gotoDefinition from "../core/schema/gotoDefinition.ts";
import { build } from "../core/schema/builder.ts";
import { createJsonRpcConnection, CreateJsonRpcLogConfig } from "./json-rpc.ts";
import { ColRow } from "../core/parser/recursive-descent-parser.ts";
import { Location } from "../core/parser/location.ts";
import { Schema } from "../core/schema/model.ts";
import findAllReferences from "../core/schema/findAllReferences.ts";
import expandEntryPaths from "../cli/pb/cmds/gen/expandEntryPaths.ts";
import * as lsp from "./lsp.ts";

export interface RunConfig {
  reader: Deno.Reader;
  writer: Deno.Writer;
  logConfig?: CreateJsonRpcLogConfig;
}
export interface Server {
  finish(): void;
}

export function run(config: RunConfig): Server {
  let projectPaths: string[] = []; // sorted string array in descending order
  const connection = createJsonRpcConnection({
    reader: config.reader,
    writer: config.writer,
    logConfig: config.logConfig,
    notificationHandlers: {
      ["initialized"]() {},
      ["textDocument/didOpen"]() {},
      ["exit"]() {
        throw new Error("Implement this");
      },
    },
    requestHandlers: {
      ["initialize"](params: lsp.InitializeParams): lsp.InitializeResult {
        if (params.workspaceFolders) {
          // TODO: traverse workspaces and find project directories
          projectPaths = params.workspaceFolders.map(({ uri }) => uri).sort()
            .reverse();
        }
        // Find .pollapo paths in workspace folders
        const result: lsp.InitializeResult = {
          capabilities: {
            // @TODO: Add support for incremental sync
            textDocumentSync: lsp.TextDocumentSyncKind.Full,
            completionProvider: {
              // @TODO: Add support for resolveProvider
              resolveProvider: false,
            },
            referencesProvider: true,
            definitionProvider: true,
            workspace: {
              workspaceFolders: {
                // @TODO: Add support for workspaceFolders
                supported: false,
              },
            },
          },
          serverInfo: {
            name: "Pbkit language server for Protocol Buffers",
            version: "0.0.1",
          },
        };
        return result;
      },
      async ["textDocument/definition"](
        params: lsp.DefinitionParams,
      ): Promise<lsp.DefinitionResponse> {
        const { textDocument, position } = params;
        const schema = await buildFreshSchema(textDocument.uri);
        const location = gotoDefinition(
          schema,
          textDocument.uri,
          positionToColRow(position),
        );
        return location ? locationToLspLocation(location) : null;
      },
      async ["textDocument/references"](
        params: lsp.ReferenceParams,
      ): Promise<lsp.ReferenceResponse> {
        const { textDocument, position } = params;
        const schema = await buildFreshSchema(textDocument.uri);
        const locations = findAllReferences(
          schema,
          textDocument.uri,
          positionToColRow(position),
        );
        return locations.map(locationToLspLocation);
      },
    },
  });
  return { finish: connection.finish };
  async function buildFreshSchema(file: string): Promise<Schema> {
    const projectPath = projectPaths.find((p) => file.startsWith(p));
    const entryPaths = projectPath
      ? [projectPath + "/.pollapo", projectPath]
      : [];
    const roots = [...entryPaths, getVendorDir()];
    const loader = createLoader({ roots });
    return await build({
      loader,
      files: [...await expandEntryPaths(entryPaths), file],
    });
  }
}

function locationToLspLocation(location: Location): lsp.Location {
  return {
    uri: location.filePath,
    range: {
      start: colRowToPosition(location.start),
      end: colRowToPosition(location.end),
    },
  };
}

function positionToColRow(position: lsp.Position): ColRow {
  return {
    col: position.character,
    row: position.line,
  };
}
function colRowToPosition(colRow: ColRow): lsp.Position {
  return {
    character: colRow.col,
    line: colRow.row,
  };
}
