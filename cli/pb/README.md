# pb

Protobuf schema compiler

## Commands

For more information, check with the `--help` argument.

- `pb gen json`
  - It reads protobuf schema files and outputs the contents interpreted by pbkit
    as a JSON string.
- `pb gen ts`
  - It reads the protobuf schema files and creates a TypeScript library.
- `pb vendor install`
  - Install the default protobuf files and googleapis proto files globally.

## How to install

### Using Homebrew

```sh
brew tap riiid/riiid
brew install pbkit
```

### Install from source

**Prerequisites**

- [git](https://git-scm.com/)
- [deno](https://deno.land/)

```sh
# Clone pbkit repo
git clone git@github.com:pbkit/pbkit.git

# Install pollapo command
deno install -n pb -A --unstable pbkit/cli/pb/entrypoint.ts
```
