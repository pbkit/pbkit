# pollapo
[Protobuf][protobuf] dependency management tool.

[protobuf]: https://developers.google.com/protocol-buffers


## How to install
### Prerequisites
- [git](https://git-scm.com/)
- [deno](https://deno.land/) over 1.8.0

### Using Homebrew

(In this case, you don't need to install deno manually)
```sh
brew tap riiid/riiid
brew install pbkit
```

### Install from source

```sh
# Clone pbkit repo
git clone git@github.com:riiid/pbkit.git

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
