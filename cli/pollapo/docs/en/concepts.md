# Concepts

## Host
A service that contains repositories.

pollapo assumes there is only one host(`github.com`) exists.


## repository
A git repository registered on the host.

You can point to a single repository with a username and repository name pair.\
If the user name is different, it is considered a different repository even if the repository name is the same.
`user-a/repo` and `user-b/repo` are different repositories.


## Revision
A specific state of a specific repository.

You can point to the revision by appending a commit hash or branch name or tag name to the repository address.\
e.g. `user/repo@v1.0.0`

Even if you are looking at the same git revision, if the name is different, it is considered a different pollapo revision.

For example, even if the commit hash viewed by `riiid/interface-common-model@master` is `eaed54c`,\
pollapo considers it a different revision than `riiid/interface-common-model@eaed54c`.

Likewise,
`riiid/interface-common-model@eaed54c` is a different revision than\
`riiid/interface-common-model@eaed54cbc9a4db`.


## Dependency
This refers to another revision pointed to by the address in the `deps` field of the `pollapo.yml` file that contains the revision.
