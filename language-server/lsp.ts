interface WorkspaceFolder {
  uri: DocumentUri;
  name: string;
}

export interface InitializeParams {
  workspaceFolders?: WorkspaceFolder[] | null;
}
export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: {
    name: string;
    version?: string;
  };
}

export enum TextDocumentSyncKind {
  None = 0,
  Full = 1,
  Incremental = 2,
}
interface CompletionOptions {
  resolveProvider?: boolean;
  completionItem?: {
    labelDetailsSupport?: boolean;
  };
}
interface ServerCapabilities {
  textDocumentSync?: TextDocumentSyncKind;
  completionProvider?: CompletionOptions;
  hoverProvider?: boolean;
  declarationProvider?: boolean; // @TODO: Add Support for DeclarationRegistrationOptions
  definitionProvider?: boolean; // @TODO: Add Support for DefinitionOptions
  typeDefinitionProvider?: boolean; // @TODO: Add Support for TypeDefinitionRegistrationOptions
  implementationProvider?: boolean; // @TODO: Add Support for ImplementationRegistrationOptions
  referencesProvider?: boolean;
  workspace?: {
    workspaceFolders?: {
      supported?: boolean;
    };
  };
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#definitionParams
 */
export interface DefinitionParams
  extends
    TextDocumentPositionParams,
    WorkDoneProgressParams,
    PartialResultParams {}

export type DefinitionResponse = Location | Location[] | LocationLink[] | null;

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#referenceParams
 */
export interface ReferenceParams
  extends
    TextDocumentPositionParams,
    WorkDoneProgressParams,
    PartialResultParams {
  context: ReferenceContext;
}

export type ReferenceResponse = Location[] | null;

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#referenceContext
 */
export interface ReferenceContext {
  /**
   * Include the declaration of the current symbol.
   */
  includeDeclaration: boolean;
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#hoverParams
 */
export interface HoverParams
  extends TextDocumentPositionParams, WorkDoneProgressParams {
}

export type HoverResponse = Hover | null;
/**
 * The result of a hover request.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#hover
 */
export interface Hover {
  /**
   * The hover's content
   * MarkedString is deprecated. Use MarkupContent instead.
   */
  contents: MarkupContent;

  /**
   * An optional range is a range inside a text document
   * that is used to visualize a hover, e.g. by changing the background color.
   */
  range?: Range;
}

/**
 * A `MarkupContent` literal represents a string value which content is
 * interpreted base on its kind flag. Currently the protocol supports
 * `plaintext` and `markdown` as markup kinds.
 *
 * If the kind is `markdown` then the value can contain fenced code blocks like
 * in GitHub issues.
 *
 * Here is an example how such a string can be constructed using
 * JavaScript / TypeScript:
 * ```typescript
 * let markdown: MarkdownContent = {
 * 	kind: MarkupKind.Markdown,
 * 	value: [
 * 		'# Header',
 * 		'Some text',
 * 		'```typescript',
 * 		'someCode();',
 * 		'```'
 * 	].join('\n')
 * };
 * ```
 *
 * *Please Note* that clients might sanitize the return markdown. A client could
 * decide to remove HTML from the markdown to avoid script execution.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#markupContentInnerDefinition
 */
export interface MarkupContent {
  /**
   * The type of the Markup
   */
  kind: MarkupKind;

  /**
   * The content itself
   */
  value: string;
}

/**
 * Describes the content type that a client supports in various
 * result literals like `Hover`, `ParameterInfo` or `CompletionItem`.
 *
 * Please note that `MarkupKinds` must not start with a `$`. This kinds
 * are reserved for internal usage.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#markupContent
 */
export type MarkupKind = "plaintext" | "markdown";

/**
 * A parameter literal used to pass a partial result token.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#partialResultParams
 */
export interface PartialResultParams {
  /**
   * An optional token that a server can use to report partial results (e.g.
   * streaming) to the client.
   */
  partialResultToken?: ProgressToken;
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#workDoneProgressParams
 */
interface WorkDoneProgressParams {
  /**
   * An optional token that a server can use to report work done progress.
   */
  workDoneToken?: ProgressToken;
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#textDocumentPositionParams
 */
interface TextDocumentPositionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

/**
 * Text documents are identified using a URI. On the protocol level, URIs are passed as strings. The corresponding JSON structure looks like this:
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#textDocumentIdentifier
 */
interface TextDocumentIdentifier {
  /**
   * The text document's URI.
   */
  uri: DocumentUri;
}

/**
 * Options to dynamically register for requests for a set of text documents.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#textDocumentRegistrationOptions
 */
interface TextDocumentRegistrationOptions {
  documentSelector: DocumentSelector | null;
}

/**
 * A document selector is the combination of one or more document filters.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#documentSelector
 */
type DocumentSelector = DocumentFilter[];

/**
 * A document filter denotes a document through properties like language, scheme or pattern. An example is a filter that applies to TypeScript files on disk. Another example is a filter the applies to JSON files with name package.json
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#documentFilter
 */
interface DocumentFilter {
  language?: string;
  scheme?: string;
  pattern?: string;
}

/**
 * Represents a location inside a resource, such as a line inside a text file.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#location
 */
export interface Location {
  uri: DocumentUri;
  range: Range;
}

/**
 * Represents a link between a source and a target location.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#locationLink
 */
interface LocationLink {
  /**
   * Span of the origin of this link.
   *
   * Used as the underlined span for mouse interaction. Defaults to the word
   * range at the mouse position.
   */
  originSelectionRange?: Range;

  /**
   * The target resource identifier of this link.
   */
  targetUri: DocumentUri;

  /**
   * The full target range of this link. If the target for example is a symbol
   * then target range is the range enclosing this symbol not including
   * leading/trailing whitespace but everything else like comments. This
   * information is typically used to highlight the range in the editor.
   */
  targetRange: Range;

  /**
   * The range that should be selected and revealed when this link is being
   * followed, e.g the name of a function. Must be contained by the the
   * `targetRange`. See also `DocumentSymbol#range`
   */
  targetSelectionRange: Range;
}

/**
 * A range in a text document expressed as (zero-based) start and end positions. A range is comparable to a selection in an editor. Therefore the end position is exclusive. If you want to specify a range that contains a line including the line ending character(s) then use an end position denoting the start of the next line.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#range
 */
interface Range {
  /**
   * The range's start position.
   */
  start: Position;

  /**
   * The range's end position.
   */
  end: Position;
}

/**
 * Position in a text document expressed as zero-based line and zero-based character offset. A position is between two characters like an ‘insert’ cursor in an editor. Special values like for example -1 to denote the end of a line are not supported.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#position
 */
export interface Position {
  /**
   * Line position in a document (zero-based).
   */
  line: uinteger;

  /**
   * Character offset on a line in a document (zero-based). Assuming that
   * the line is represented as a string, the `character` value represents
   * the gap between the `character` and `character + 1`.
   *
   * If the character value is greater than the line length it defaults back
   * to the line length.
   */
  character: uinteger;
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#progress
 */
type ProgressToken = integer | string;

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#progress
 */
interface ProgressParams<T> {
  /**
   * The progress token provided by the client or server.
   */
  token: ProgressToken;

  /**
   * The progress data.
   */
  value: T;
}

/**
 * Defines an integer number in the range of -2^31 to 2^31 - 1.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#integer
 */
export type integer = number;

/**
 * Defines an unsigned integer number in the range of 0 to 2^31 - 1.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#uinteger
 */
export type uinteger = number;

type DocumentUri = string;
