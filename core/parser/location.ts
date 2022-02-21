import { ColRow } from "./recursive-descent-parser.ts";

export interface Location extends Range {
  filePath: string;
}

export interface Range {
  start: ColRow;
  end: ColRow;
}
