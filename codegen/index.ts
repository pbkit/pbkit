import type { Reader, ReaderSync } from "../misc/io.ts";

export type CodeEntry = [filePath: string, data: Reader | ReaderSync];
export type SyncCodeEntry = [filePath: string, data: ReaderSync];
export type AsyncCodeEntry = [filePath: string, data: Reader];
