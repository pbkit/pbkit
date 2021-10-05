export type CodeEntry = [filePath: string, data: Deno.Reader | Deno.ReaderSync];
export type SyncCodeEntry = [filePath: string, data: Deno.ReaderSync];
export type AsyncCodeEntry = [filePath: string, data: Deno.Reader];
