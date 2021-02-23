export interface Loader {
  load(path: string): Promise<LoadResult | null>;
}

export interface LoadResult {
  absolutePath: string;
  data: string;
}
