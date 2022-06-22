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
  semanticTokensProvider?: SemanticTokensOptions; // @TODO: Add Support for SemanticTokensRegistrationOptions
  referencesProvider?: boolean;
  workspace?: {
    workspaceFolders?: {
      supported?: boolean;
    };
  };
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#semanticTokensOptions
 */
interface SemanticTokensOptions extends WorkDoneProgressParams {
  legend: SemanticTokensLegend;
  range?: boolean;
  full?: boolean | { delta?: boolean };
}
/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#semanticTokensLegend
 */
interface SemanticTokensLegend {
  tokenTypes: string[];
  tokenModifiers: string[];
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
 * Requesting semantic tokens for a whole file
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#semanticTokensParams
 */
export interface SematicTokenParams
  extends WorkDoneProgressParams, PartialResultParams {
  /**
   * The text document.
   */
  textDocument: TextDocumentIdentifier;
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#semanticTokens
 */
export interface SemanticTokens {
  /**
   * An optional result id. If provided and clients support delta updating
   * the client will include the result id in the next semantic token request.
   * A server can then instead of computing all semantic tokens again simply
   * send a delta.
   */
  resultId?: string;

  /**
   * The actual tokens.
   */
  data: uinteger[];
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionParams
 */
export interface CompletionParams
  extends
    TextDocumentPositionParams,
    WorkDoneProgressParams,
    PartialResultParams {
  /**
   * The completion context. This is only available if the client specifies
   * to send this using the client capability
   * `completion.contextSupport === true`
   */
  context?: CompletionContext;
}

/**
 * How a completion was triggered
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionTriggerKind
 */
export enum CompletionTriggerKind {
  Invoked = 1,
  TriggerCharacter = 2,
  TriggerForIncompleteCompletion = 3,
}

/**
 * Contains additional information about the context in which a completion
 * request is triggered.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionContext
 */
export interface CompletionContext {
  /**
   * How the completion was triggered.
   */
  triggerKind: CompletionTriggerKind;

  /**
   * The trigger character (a single character) that has trigger code
   * complete. Is undefined if
   * `triggerKind !== CompletionTriggerKind.TriggerCharacter`
   */
  triggerCharacter?: string;
}

/**
 * Represents a collection of [completion items](#CompletionItem) to be
 * presented in the editor.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionList
 */
export interface CompletionList {
  /**
   * This list is not complete. Further typing should result in recomputing
   * this list.
   *
   * Recomputed lists have all their items replaced (not appended) in the
   * incomplete completion sessions.
   */
  isIncomplete: boolean;

  /**
   * In many cases the items of an actual completion result share the same
   * value for properties like `commitCharacters` or the range of a text
   * edit. A completion list can therefore define item defaults which will
   * be used if a completion item itself doesn't specify the value.
   *
   * If a completion list specifies a default value and a completion item
   * also specifies a corresponding value the one from the item is used.
   *
   * Servers are only allowed to return default values if the client
   * signals support for this via the `completionList.itemDefaults`
   * capability.
   *
   * @since 3.17.0
   */
  itemDefaults?: {
    /**
     * A default commit character set.
     *
     * @since 3.17.0
     */
    commitCharacters?: string[];

    /**
     * A default edit range
     *
     * @since 3.17.0
     */
    editRange?: Range | {
      insert: Range;
      replace: Range;
    };

    /**
     * A default insert text format
     *
     * @since 3.17.0
     */
    insertTextFormat?: InsertTextFormat;

    /**
     * A default insert text mode
     *
     * @since 3.17.0
     */
    insertTextMode?: InsertTextMode;

    /**
     * A default data value.
     *
     * @since 3.17.0
     */
    data?: any;
  };

  /**
   * The completion items.
   */
  items: CompletionItem[];
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItem
 */
export interface CompletionItem {
  /**
   * The label of this completion item.
   *
   * The label property is also by default the text that
   * is inserted when selecting this completion.
   *
   * If label details are provided the label itself should
   * be an unqualified name of the completion item.
   */
  label: string;

  /**
   * Additional details for the label
   *
   * @since 3.17.0
   */
  labelDetails?: CompletionItemLabelDetails;

  /**
   * The kind of this completion item. Based of the kind
   * an icon is chosen by the editor. The standardized set
   * of available values is defined in `CompletionItemKind`.
   */
  kind?: CompletionItemKind;

  /**
   * Tags for this completion item.
   *
   * @since 3.15.0
   */
  tags?: CompletionItemTag[];

  /**
   * A human-readable string with additional information
   * about this item, like type or symbol information.
   */
  detail?: string;

  /**
   * A human-readable string that represents a doc-comment.
   */
  documentation?: string | MarkupContent;

  /**
   * Indicates if this item is deprecated.
   *
   * @deprecated Use `tags` instead if supported.
   */
  deprecated?: boolean;

  /**
   * Select this item when showing.
   *
   * *Note* that only one completion item can be selected and that the
   * tool / client decides which item that is. The rule is that the *first*
   * item of those that match best is selected.
   */
  preselect?: boolean;

  /**
   * A string that should be used when comparing this item
   * with other items. When `falsy` the label is used
   * as the sort text for this item.
   */
  sortText?: string;

  /**
   * A string that should be used when filtering a set of
   * completion items. When `falsy` the label is used as the
   * filter text for this item.
   */
  filterText?: string;

  /**
   * A string that should be inserted into a document when selecting
   * this completion. When `falsy` the label is used as the insert text
   * for this item.
   *
   * The `insertText` is subject to interpretation by the client side.
   * Some tools might not take the string literally. For example
   * VS Code when code complete is requested in this example
   * `con<cursor position>` and a completion item with an `insertText` of
   * `console` is provided it will only insert `sole`. Therefore it is
   * recommended to use `textEdit` instead since it avoids additional client
   * side interpretation.
   */
  insertText?: string;

  /**
   * The format of the insert text. The format applies to both the
   * `insertText` property and the `newText` property of a provided
   * `textEdit`. If omitted defaults to `InsertTextFormat.PlainText`.
   *
   * Please note that the insertTextFormat doesn't apply to
   * `additionalTextEdits`.
   */
  insertTextFormat?: InsertTextFormat;

  /**
   * How whitespace and indentation is handled during completion
   * item insertion. If not provided the client's default value depends on
   * the `textDocument.completion.insertTextMode` client capability.
   *
   * @since 3.16.0
   * @since 3.17.0 - support for `textDocument.completion.insertTextMode`
   */
  insertTextMode?: InsertTextMode;

  /**
   * An edit which is applied to a document when selecting this completion.
   * When an edit is provided the value of `insertText` is ignored.
   *
   * *Note:* The range of the edit must be a single line range and it must
   * contain the position at which completion has been requested.
   *
   * Most editors support two different operations when accepting a completion
   * item. One is to insert a completion text and the other is to replace an
   * existing text with a completion text. Since this can usually not be
   * predetermined by a server it can report both ranges. Clients need to
   * signal support for `InsertReplaceEdit`s via the
   * `textDocument.completion.completionItem.insertReplaceSupport` client
   * capability property.
   *
   * *Note 1:* The text edit's range as well as both ranges from an insert
   * replace edit must be a [single line] and they must contain the position
   * at which completion has been requested.
   * *Note 2:* If an `InsertReplaceEdit` is returned the edit's insert range
   * must be a prefix of the edit's replace range, that means it must be
   * contained and starting at the same position.
   *
   * @since 3.16.0 additional type `InsertReplaceEdit`
   */
  textEdit?: TextEdit | InsertReplaceEdit;

  /**
   * The edit text used if the completion item is part of a CompletionList and
   * CompletionList defines an item default for the text edit range.
   *
   * Clients will only honor this property if they opt into completion list
   * item defaults using the capability `completionList.itemDefaults`.
   *
   * If not provided and a list's default range is provided the label
   * property is used as a text.
   *
   * @since 3.17.0
   */
  textEditText?: string;

  /**
   * An optional array of additional text edits that are applied when
   * selecting this completion. Edits must not overlap (including the same
   * insert position) with the main edit nor with themselves.
   *
   * Additional text edits should be used to change text unrelated to the
   * current cursor position (for example adding an import statement at the
   * top of the file if the completion item will insert an unqualified type).
   */
  additionalTextEdits?: TextEdit[];

  /**
   * An optional set of characters that when pressed while this completion is
   * active will accept it first and then type that character. *Note* that all
   * commit characters should have `length=1` and that superfluous characters
   * will be ignored.
   */
  commitCharacters?: string[];

  /**
   * An optional command that is executed *after* inserting this completion.
   * *Note* that additional modifications to the current document should be
   * described with the additionalTextEdits-property.
   */
  command?: Command;

  /**
   * A data entry field that is preserved on a completion item between
   * a completion and a completion resolve request.
   */
  data?: any;
}

/**
 * Additional details for a completion item label.
 *
 * @since 3.17.0
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemLabelDetails
 */
export interface CompletionItemLabelDetails {
  /**
   * An optional string which is rendered less prominently directly after
   * {@link CompletionItem.label label}, without any spacing. Should be
   * used for function signatures or type annotations.
   */
  detail?: string;

  /**
   * An optional string which is rendered less prominently after
   * {@link CompletionItemLabelDetails.detail}. Should be used for fully qualified
   * names or file path.
   */
  description?: string;
}

/**
 * Completion item tags are extra annotations that tweak the rendering of a
 * completion item.
 *
 * @since 3.15.0
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemTag
 */
export enum CompletionItemTag {
  /**
   * Render a completion as obsolete, usually using a strike-out.
   */
  Deprecated = 1,
}

/**
 * A special text edit to provide an insert and a replace operation.
 *
 * @since 3.16.0
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#insertReplaceEdit
 */
export interface InsertReplaceEdit {
  /**
   * The string to be inserted.
   */
  newText: string;

  /**
   * The range if the insert is requested
   */
  insert: Range;

  /**
   * The range if the replace is requested.
   */
  replace: Range;
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#command
 */
interface Command {
  /**
   * Title of the command, like `save`.
   */
  title: string;
  /**
   * The identifier of the actual command handler.
   */
  command: string;
  /**
   * Arguments that the command handler should be
   * invoked with.
   */
  arguments?: any[];
}

/**
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textEdit
 */
interface TextEdit {
  /**
   * The range of the text document to be manipulated. To insert
   * text into a document create a range where start === end.
   */
  range: Range;

  /**
   * The string to be inserted. For delete operations use an
   * empty string.
   */
  newText: string;
}

/**
 * The kind of a completion entry.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemKind
 */
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

/**
 * Defines whether the insert text in a completion item should be interpreted as
 * plain text or a snippet.
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#insertTextFormat
 */
export enum InsertTextFormat {
  /**
   * The primary text to be inserted is treated as a plain string.
   */
  PlainText = 1,

  /**
   * The primary text to be inserted is treated as a snippet.
   *
   * A snippet can define tab stops and placeholders with `$1`, `$2`
   * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
   * the end of the snippet. Placeholders with equal identifiers are linked,
   * that is typing in one will update others too.
   */
  Snippet = 2,
}

/**
 * How whitespace and indentation is handled during completion
 * item insertion.
 *
 * @since 3.16.0
 * @docs https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#insertTextMode
 */
export enum InsertTextMode {
  /**
   * The insertion or replace strings is taken as it is. If the
   * value is multi line the lines below the cursor will be
   * inserted using the indentation defined in the string value.
   * The client will not apply any kind of adjustments to the
   * string.
   */
  asIs = 1,

  /**
   * The editor adjusts leading whitespace of new lines so that
   * they match the indentation up to the cursor of the line for
   * which the item is accepted.
   *
   * Consider a line like this: <2tabs><cursor><3tabs>foo. Accepting a
   * multi line completion item is indented using 2 tabs and all
   * following lines inserted will be indented using 2 tabs as well.
   */
  adjustIndentation = 2,
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
