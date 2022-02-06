import { parse } from "./proto.ts";

Deno.test("legal field 1", () => {
  const { ast: { statements: [message] } } = parse(`
    message Foo {
      foo bar = 1;
    }
  `);
  if (message.type !== "message") throw new Error('message.type !== "message"');
  const firstMessageBodyStatement = message.messageBody.statements[0];
  if (firstMessageBodyStatement.type !== "field") {
    throw new Error('firstMessageBodyStatement.type !== "field"');
  }
});

Deno.test("legal field 2", () => {
  const { ast: { statements: [message] } } = parse(`
    message Foo {
      foo message = 1;
    }
  `);
  if (message.type !== "message") throw new Error('message.type !== "message"');
  const firstMessageBodyStatement = message.messageBody.statements[0];
  if (firstMessageBodyStatement.type !== "field") {
    throw new Error('firstMessageBodyStatement.type !== "field"');
  }
});

Deno.test("malformed field 1", () => {
  const { ast: { statements: [message] } } = parse(`
    message Foo {
      foo
    }
  `);
  if (message.type !== "message") throw new Error('message.type !== "message"');
  const firstMessageBodyStatement = message.messageBody.statements[0];
  if (firstMessageBodyStatement.type !== "malformed-field") {
    throw new Error('firstMessageBodyStatement.type !== "malformed-field"');
  }
});

Deno.test("malformed field 2", () => {
  const { ast: { statements: [message] } } = parse(`
    message Foo {
      foo bar
      message Bar {}
    }
  `);
  if (message.type !== "message") throw new Error('message.type !== "message"');
  const firstMessageBodyStatement = message.messageBody.statements[0];
  if (firstMessageBodyStatement.type !== "malformed-field") {
    throw new Error('firstMessageBodyStatement.type !== "malformed-field"');
  }
  const secondMessageBodyStatement = message.messageBody.statements[1];
  if (secondMessageBodyStatement.type !== "message") {
    throw new Error('secondMessageBodyStatement.type !== "message"');
  }
});

Deno.test("malformed field 3", () => {
  const { ast: { statements: [message] } } = parse(`
    message Foo {
      foo
      legal field = 1;
    }
  `);
  if (message.type !== "message") throw new Error('message.type !== "message"');
  const firstMessageBodyStatement = message.messageBody.statements[0];
  if (firstMessageBodyStatement.type !== "malformed-field") {
    throw new Error('firstMessageBodyStatement.type !== "malformed-field"');
  }
  const secondMessageBodyStatement = message.messageBody.statements[1];
  if (secondMessageBodyStatement.type !== "field") {
    throw new Error('secondMessageBodyStatement.type !== "message"');
  }
});
