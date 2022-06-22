<div align="center">
  <h1>pbkit</h1>
  <img width="128" src="https://avatars.githubusercontent.com/u/90100959">
  <p>TypeScript implementation of protobuf.</p>
  <p>Supports Deno and Node.js.</p>
  <a href="https://discord.gg/PHmV3nhvQq">
    <img src="https://img.shields.io/discord/922795162873233429?label=Discord&style=flat-square" />
  </a>
  <a href="https://twitter.com/pbkit_">
    <img src="https://img.shields.io/twitter/url.svg?label=Follow%20%40pbkit_&style=social&url=https%3A%2F%2Ftwitter.com%2Fpbkit_" />
  </a>
  <br>
  <a href="https://github.com/pbkit/pbkit/releases">
    <img src="https://img.shields.io/github/release/pbkit/pbkit/all.svg" />
  </a>
  <a href="https://deno.land/x/pbkit">
    <img src="https://img.shields.io/badge/deno.land/x/-pbkit-gray?logo=deno&labelColor=black" />
  </a>
  <br>
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
  - [How to install and how to use](./cli/pb/README.md)
- `pollapo` - A package manager for the protobuf schema.
  - A GitHub repository of `.proto` files is treated as a single pollapo
    package.
  - [How to install and how to use](./cli/pollapo/docs/en/getting-started.md)

### Browser Extension

  - pbkit-devtools
    - <img width=300 src="https://user-images.githubusercontent.com/690661/161203806-a6d8a864-8693-4744-8f4a-51407f4aa6e7.png" />
    - [repo](https://github.com/pbkit/pbkit-devtools)
    - [chrome web store](https://chrome.google.com/webstore/detail/pbkit-devtools/fjacmiijeihblfhobghceofniolonhca)

### Editor Extension

  - vscode-pbkit
    - Syntax highlight, Go to definition for VSCode.
    - [repo](https://github.com/pbkit/vscode-pbkit)
    - [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=pbkit.vscode-pbkit)

### Library

- Deno - [deno.land/x/pbkit](https://deno.land/x/pbkit)
- NPM - [pbkit][npm pbkit]
  - [@pbkit/runtime][@pbkit/runtime] - This is a separate package with only the
    `runtime` folder.
  - See also - <https://github.com/pbkit/npm-packages>
    - RPC related libraries
      - [frpc-client](https://www.npmjs.com/package/@pbkit/frpc-client)
      - [frpc-server](https://www.npmjs.com/package/@pbkit/frpc-server)
      - [grpc-client](https://www.npmjs.com/package/@pbkit/grpc-client)
      - [grpc-web-client](https://www.npmjs.com/package/@pbkit/grpc-web-client)

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
