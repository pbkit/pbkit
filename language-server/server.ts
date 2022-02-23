import { getVendorDir } from "../cli/pb/config.ts";
import { createLoader } from "../core/loader/deno-fs.ts";
import gotoDefinition, {
  getTypeInformation,
} from "../core/schema/gotoDefinition.ts";
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
  let schema: Schema | undefined;
  const connection = createJsonRpcConnection({
    reader: config.reader,
    writer: config.writer,
    logConfig: config.logConfig,
    notificationHandlers: {
      ["initialized"]() {},
      ["textDocument/didOpen"](params: lsp.DidOpenTextDocumentParams) {
        if (!schema) return;
        const { textDocument } = params;
        if (textDocument.uri in schema.files) return;
        revalidateSchema([textDocument.uri]);
      },
      ["textDocument/didChange"](params: lsp.DidChangeTextDocumentParams) {},
      ["textDocument/didSave"](params: any) {
        const { textDocument } = params;
        revalidateSchema([textDocument.uri]);
      },
      ["exit"]() {
        throw new Error("Implement this");
      },
    },
    requestHandlers: {
      async ["initialize"](
        params: lsp.InitializeParams,
      ): Promise<lsp.InitializeResult> {
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
        schema = await buildFreshSchema();
        return result;
      },
      async ["textDocument/definition"](
        params: lsp.DefinitionParams,
      ): Promise<lsp.DefinitionResponse> {
        const { textDocument, position } = params;
        // @TODO: Throw error for re-initialize?
        if (!schema) return null;
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
        // @TODO: Throw error for re-initialize?
        if (!schema) return null;
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
        const schema = await buildFreshSchema();
        const typeInformation = getTypeInformation(
          schema,
          textDocument.uri,
          positionToColRow(position),
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
  async function buildFreshSchema(): Promise<Schema> {
    const entryPaths = projectPaths.flatMap(
      (projectPath) => [projectPath + "/.pollapo", projectPath],
    );
    const roots = [...entryPaths, getVendorDir()];
    const loader = createLoader({ roots });
    return await build({
      loader,
      files: [...await expandEntryPaths(entryPaths)],
    });
  }
  async function revalidateSchema(files: string[]): Promise<Schema> {
    if (!schema) return buildFreshSchema();
    const projectPath = projectPaths.find((p) =>
      files.some((file) => file.startsWith(p))
    );
    const entryPaths = projectPath
      ? [projectPath + "/.pollapo", projectPath]
      : [];
    const roots = [...entryPaths, getVendorDir()];
    const loader = createLoader({ roots });
    const partialSchema = await build({
      loader,
      files,
    });
    return schema = revalidate(schema, partialSchema, files);
  }
  function revalidate(oldSchema: Schema, newSchema: Schema, files: string[]) {
    const result: Schema = oldSchema;
    for (const file of files) {
      if (newSchema.files[file]) {
        result.files[file] = newSchema.files[file];
      }
      for (const [path, service] of Object.entries(newSchema.services)) {
        if (files.some((file) => file === service.filePath)) {
          result.services[path] = service;
        }
      }
      for (const [path, type] of Object.entries(newSchema.types)) {
        if (files.some((file) => file === type.filePath)) {
          result.types[path] = type;
        }
      }
    }
    updateShallowResult();
    return result;
    function updateShallowResult() {
      updateShallowDiff(result.extends, newSchema.extends);
      updateShallowDiff(result.services, newSchema.services);
      updateShallowDiff(result.files, newSchema.files);
      updateShallowDiff(result.types, newSchema.types);
    }
    function updateShallowDiff(a: Record<string, any>, b: Record<string, any>) {
      const _a = new Set(Object.keys(a));
      const _b = new Set(Object.keys(b));
      const newKeys = diff(_b, _a);
      for (const key of newKeys) {
        a[key] = b[key];
      }
    }
    function diff<T>(a: Set<T>, b: Set<T>) {
      return [...a].filter((value) => !b.has(value));
    }
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
