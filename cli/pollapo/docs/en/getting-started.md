# pollapo

[Protobuf][protobuf] dependency management tool.

[protobuf]: https://developers.google.com/protocol-buffers

## How to install

### Using Homebrew

```sh
brew tap riiid/riiid
brew install pbkit
```

### Windows

#### Using msi installer

You can find msi installer in release assets.

#### Using [winget](https://github.com/microsoft/winget-cli)

```powershell
winget install Riiid.pollapo
```

### Linux

#### Pre-built binary

You can find pre-built binary in release assets.
Download it and copy it to somewhere in PATH.

### Install from source

**Prerequisites**

- [git](https://git-scm.com/)
- [deno](https://deno.land/)

```sh
# Clone pbkit repo
git clone git@github.com:pbkit/pbkit.git

# Install pollapo command
deno install -n pollapo -A --unstable pbkit/cli/pollapo/entrypoint.ts
```

## Usage

### Login

Pollapo downloads repositories using the GitHub api.\
Sign in with GitHub account to get authentication information.

```sh
pollapo login
```

### Install dependencies

Run the command as below in where you want to install the dependencies:

```sh
# Add dependencies
pollapo add riiid/interface-common-model riiid/interface-inside-model

# Install dependencies
pollapo install # Check the created `.pollapo` directory
```

## Auto completion

### Bash

```sh
source <(pollapo completions bash)
```

### Fish

```sh
source (pollapo completions fish | psub)
```

### Zsh

```sh
source <(pollapo completions zsh)
```
