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
import {
  getSemanticTokens,
  toDeltaSemanticTokens,
  tokenModifiers,
  tokenTypes,
  toLspRepresentation,
} from "./semantic-token-provider.ts";
import { getCompletionItems } from "./completion.ts";
import { createOpenProtoManager } from "./open-proto-manager.ts";

export interface RunConfig {
  reader: Deno.Reader;
  writer: Deno.Writer;
  logConfig?: CreateJsonRpcLogConfig;
}
export interface Server {
  finish(): void;
}

export function run(config: RunConfig): Server {
  const openProtoManager = createOpenProtoManager();
  const projectManager = createProjectManager(openProtoManager);
  const connection = createJsonRpcConnection({
    reader: config.reader,
    writer: config.writer,
    logConfig: config.logConfig,
    notificationHandlers: {
      ["initialized"]() {},
      ["textDocument/didOpen"]({ textDocument }) {
        updateProto(textDocument.uri, textDocument.text);
      },
      ["textDocument/didChange"]({ textDocument, contentChanges }) {
        updateProto(textDocument.uri, contentChanges[0].text);
      },
      ["textDocument/didClose"]({ textDocument }) {
        openProtoManager.delete(textDocument.uri);
      },
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
            completionProvider: {
              resolveProvider: true,
              completionItem: {
                labelDetailsSupport: true,
              },
            },
            referencesProvider: true,
            definitionProvider: true,
            hoverProvider: true,
            semanticTokensProvider: {
              legend: { tokenModifiers, tokenTypes },
              full: true,
              range: false,
            },
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
        const file = textDocument.uri;
        const schema = await buildFileSchema(file);
        if (!schema) return null;
        const colRow = positionToColRow(position);
        const location = gotoDefinition(schema, file, colRow);
        return location ? locationToLspLocation(location) : null;
      },
      async ["textDocument/references"](
        params: lsp.ReferenceParams,
      ): Promise<lsp.ReferenceResponse> {
        const { textDocument, position } = params;
        const file = textDocument.uri;
        const schema = await buildProjectSchema(file);
        if (!schema) return null;
        const colRow = positionToColRow(position);
        const locations = findAllReferences(schema, file, colRow);
        return locations.map(locationToLspLocation);
      },
      async ["textDocument/hover"](
        params: lsp.HoverParams,
      ): Promise<lsp.HoverResponse> {
        const { textDocument, position } = params;
        const file = textDocument.uri;
        const colRow = positionToColRow(position);
        const parseResult = openProtoManager.getParseResult(file);
        if (!parseResult) return null;
        if (!isTypeSpecifier(parseResult, colRow)) return null;
        const schema = await buildFileSchema(file);
        if (!schema) return null;
        const value = getTypeInformation(schema, file, colRow);
        if (!value) return null;
        return { contents: { kind: "markdown", value } };
      },
      async ["textDocument/semanticTokens/full"](
        params: lsp.SematicTokenParams,
      ): Promise<lsp.SemanticTokens | null> {
        const { textDocument } = params;
        const parseResult = openProtoManager.getParseResult(textDocument.uri);
        if (!parseResult) return null;
        const semanticTokens = getSemanticTokens(parseResult);
        const data = toLspRepresentation(toDeltaSemanticTokens(semanticTokens));
        return { data };
      },
      async ["textDocument/completion"](
        params: lsp.CompletionParams,
      ): Promise<lsp.CompletionList> {
        const { textDocument, position } = params;
        const file = textDocument.uri;
        const colRow = positionToColRow(position);
        const schema = await buildFileSchema(file);
        if (!schema) return { isIncomplete: true, items: [] };
        const items = getCompletionItems(schema, file, colRow);
        return { isIncomplete: false, items };
      },
      async ["completionItem/resolve"](params) {
        return params;
      },
    },
  });
  return { finish: connection.finish };
  async function buildFileSchema(file: string): Promise<Schema | null> {
    try {
      const projectPath = projectManager.getProjectPath(file);
      const loader = await projectManager.getProjectLoader(projectPath);
      return await build({ loader, files: [file] });
    } catch {
      return null;
    }
  }
  async function buildProjectSchema(file: string): Promise<Schema | null> {
    try {
      const projectPath = projectManager.getProjectPath(file);
      const loader = await projectManager.getProjectLoader(projectPath);
      const files = await projectManager.getProjectProtoFiles(file);
      return await build({ loader, files });
    } catch {
      return null;
    }
  }
  async function updateProto(
    absolutePath: string,
    data: string,
  ): Promise<void> {
    openProtoManager.upsert(absolutePath, data);
    const projectPath = projectManager.getProjectPath(absolutePath);
    if (!projectPath) return;
    const loader = await projectManager.getProjectLoader(projectPath);
    loader.update({ absolutePath, data });
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
