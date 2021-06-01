import { parse } from "./proto.ts";

Deno.test("#39", () => {
  const code = `
    message TestSubmessageMaps {
      optional TestMaps m = 1;
    }
  `;
  parse(code);
});
