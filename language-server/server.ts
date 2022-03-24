import gotoDefinition, {
  getTypeInformation,
  isTypeSpecifier,
} from "../core/schema/gotoDefinition.ts";
import { build } from "../core/schema/builder.ts";
import { createJsonRpcConnection, CreateJsonRpcLogConfig } from "./json-rpc.ts";
import { ColRow } from "../core/parser/recursive-descent-parser.ts";
import { Location } from "../core/parser/location.ts";
import { Schema } from "../core/schema/model.ts";
import findAllReferences from "../core/schema/findAllReferences.ts";
import * as lsp from "./lsp.ts";
import { createProjectManager } from "./project.ts";
import { parse } from "../core/parser/proto.ts";
import { fromFileUrl } from "../core/loader/deno-fs.ts";

export interface RunConfig {
  reader: Deno.Reader;
  writer: Deno.Writer;
  logConfig?: CreateJsonRpcLogConfig;
}
export interface Server {
  finish(): void;
}

export function run(config: RunConfig): Server {
  const projectManager = createProjectManager();
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
        for (const folder of params.workspaceFolders || []) {
          projectManager.addProjectPath(folder.uri);
        }
        // Find .pollapo paths in workspace folders
        const result: lsp.InitializeResult = {
          capabilities: {
            // @TODO: Add support for incremental sync
            textDocumentSync: lsp.TextDocumentSyncKind.Full,
            completionProvider: undefined,
            referencesProvider: true,
            definitionProvider: true,
            hoverProvider: true,
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
      async ["textDocument/hover"](
        params: lsp.HoverParams,
      ): Promise<lsp.HoverResponse> {
        const { textDocument, position } = params;
        const colRow = positionToColRow(position);
        const parseResult = parse(
          await Deno.readTextFile(fromFileUrl(textDocument.uri)),
        );
        // try parse textDocument only -> check if it is type specifier
        if (!isTypeSpecifier(parseResult, colRow)) return null;
        const schema = await buildFreshSchema(textDocument.uri);
        const typeInformation = getTypeInformation(
          schema,
          textDocument.uri,
          colRow,
        );
        if (!typeInformation) return null;
        return {
          contents: {
            kind: "markdown",
            value: typeInformation,
          },
        };
      },
    },
  });
  return { finish: connection.finish };
  async function buildFreshSchema(file: string): Promise<Schema> {
    const buildConfig = await projectManager.createBuildConfig(file);
    return await build(buildConfig);
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
