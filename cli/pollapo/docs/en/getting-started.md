# pollapo
[Protobuf][protobuf] dependency management tool.

[protobuf]: https://developers.google.com/protocol-buffers


## How to install
### Prerequisites
- [gh](https://cli.github.com/)
- [git](https://git-scm.com/)
- [deno](https://deno.land/) over 1.8.0

```sh
# Clone pbkit repo
git clone git@github.com:riiid/pbkit.git

# Install pollapo command
deno install -n pollapo --unstable --allow-env --allow-net --allow-read --allow-write pbkit/cli/pollapo/entrypoint.ts
```


## Usage

### Login
pollapo downloads the repository using the github api.\
Login to github cli to get authentication information.
```sh
gh auth login
```

### Install dependencies
Create the `pollapo.yml` file as below in the repository where you want to install the dependencies.
```yml
deps:
  - riiid/interface-common-model@main
  - riiid/interface-inside-model@main
```

Running the command below will create a `.pollapo` directory and install its dependencies.
```sh
pollapo install
```
