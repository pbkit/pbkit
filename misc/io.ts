export interface Reader {
  read(p: Uint8Array): Promise<number | null>;
}

export interface ReaderSync {
  readSync(p: Uint8Array): number | null;
}

export interface Writer {
  write(p: Uint8Array): Promise<number>;
}

export interface WriterSync {
  writeSync(p: Uint8Array): number;
}

export interface Closer {
  close(): void;
}
