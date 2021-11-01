<div align="center">
  <h1>pbkit</h1>
  <img src="https://avatars.githubusercontent.com/u/90100959">
  <p>TypeScript implementation of protobuf.</p>
  <p>Supports Deno and Node.js.</p>
</div>

## What is Protobuf?

<https://developers.google.com/protocol-buffers>

> Protocol buffers are Google's language-neutral, platform-neutral, extensible
> mechanism for serializing structured data – think XML, but smaller, faster,
> and simpler.

## And what is Pbkit?

Pbkit is a collection of tools related to protobuf.

It is written in TypeScript and uses the Deno api.

However, it can be executed in any JavaScript environment (including Node.js or
web browser) because it does not use platform APIs inside the `core` directory.

## What features are provided?

### CLI

- `pb` - Protobuf schema compiler like `protoc`.
  - `protoc` has native binary dependencies, but `pb` command is written in pure
    TypeScript, so it can be used comfortably in Node.js projects, etc., and can
    even easily be run in a web browser.
- `pollapo` - A package manager for the protobuf schema.
  - A GitHub repository of `.proto` files is treated as a single pollapo
    package.
  - [How to install and how to use](./cli/pollapo/docs/en/getting-started.md)

### Library

- Deno - [deno.land/x/pbkit](https://deno.land/x/pbkit)
- NPM - [pbkit][npm pbkit]
  - [@pbkit/runtime][@pbkit/runtime] - This is a separate package with only the
    `runtime` folder.
  - See also - <https://github.com/pbkit/npm-packages>
    - There are RPC related libraries

[npm pbkit]: https://www.npmjs.com/package/pbkit
[@pbkit/runtime]: https://www.npmjs.com/package/@pbkit/runtime

## Who uses pbkit?

### Company

- [Riiid][riiid] - Pbkit was originally created to use protobuf in Riiid.

[riiid]: https://riiid.com/

### Open source project

- [AST explorer][AST explorer] - Used to parse protobuf files
- [AstQL][AstQL] - Used to parse protobuf files

[AST explorer]: https://github.com/fkling/astexplorer
[AstQL]: https://github.com/gen-codes/astql

## License

pbkit is dual-licensed under Apache 2.0 and MIT terms.\
see [LICENSE-APACHE][LICENSE-APACHE] and [LICENSE-MIT][LICENSE-MIT] for details.

[LICENSE-APACHE]: ./LICENSE-APACHE
[LICENSE-MIT]: ./LICENSE-MIT
