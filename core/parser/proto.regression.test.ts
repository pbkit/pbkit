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

Deno.test("#47", () => {
  parse(`
    message MessageOptions {
      reserved 4, 5, 6;
    }
  `);
});

Deno.test("#49", () => {
  parse(`
    message Proto3OptionalExtensions {
      option (protobuf_unittest.Proto3OptionalExtensions.ext_no_optional) = 8;
    }
  `);
});

Deno.test("#55", () => {
  parse(`
    enum Foo {
      reserved 1;
    }
  `);
});

Deno.test("#78", () => {
  parse(`
    message TestAllTypesLite {
      optional double default_double = 72 [default = 52e3];
    }
  `);
});

Deno.test("#80", () => {
  parse(`
    option (google.api.http) = {
      post: "/v2/{parent=projects/*}/draft:write"
      body: "*"
    };
  `);
});

Deno.test("#83", () => {
  parse(String.raw`
    option (bytes_opt) = "Hello\0World";
  `);
});

Deno.test("#86", () => {
  parse(String.raw`
    message TestMessage {
      optional bytes optional_bytes = 9 [default = "\0\1\2\100fubar"];
    }
  `);
});

Deno.test("#88", () => {
  parse(String.raw`
    service SnapshotsV1Beta3 {
      option (google.api.oauth_scopes) =
        "https://www.googleapis.com/auth/cloud-platform,"
        "https://www.googleapis.com/auth/compute,"
        "https://www.googleapis.com/auth/compute.readonly,"
        "https://www.googleapis.com/auth/userinfo.email";
      }
    }
  `);
});

Deno.test("#103", () => {
  parse(String.raw`
    message TestReservedFields {
      reserved "bar", "baz";
    }
  `);
});
