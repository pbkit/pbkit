import { parse } from "./proto.ts";

Deno.test("#39", () => {
  parse(`
    message TestSubmessageMaps {
      optional TestMaps m = 1;
    }
  `);
});

Deno.test("#42", () => {
  parse(`
    message TestAllTypesProto3 {
      int32 _field_name3 = 403;
    }
  `);
});

Deno.test("#43", () => {
  parse(`
    message TestDiffMessage {
      repeated group Item = 1 {}
    }
  `);
});

Deno.test("#44", () => {
  parse(`
    message TestMessageSet {
      option message_set_wire_format = true;
    }
  `);
});

Deno.test("#45", () => {
  parse(`
    enum EnumWithLargeValue {
      VALUE_MAX = 0x7fffffff;
    }
  `);
});

Deno.test("#46", () => {
  parse(`
    message TestMessage {
      optional double optional_double = 6 [default = 6.0];
    }
  `);
});
