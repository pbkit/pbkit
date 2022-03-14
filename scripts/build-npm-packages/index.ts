export interface BuildConfig extends NameAndVersion {
  dist: string;
  tmp?: string;
}

export interface NameAndVersion {
  name: string;
  version: string;
}
