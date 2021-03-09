# pollapo
pollapo는 [Protobuf][protobuf] 의존성 관리 도구입니다.

[protobuf]: https://developers.google.com/protocol-buffers


## 설치
### 전제조건
- [gh](https://cli.github.com/)
- [git](https://git-scm.com/)
- [deno](https://deno.land/) 1.8.0 이상

```sh
# pbkit 저장소를 클론받습니다.
git clone git@github.com:riiid/pbkit.git

# pollapo 명령어를 설치합니다.
deno install -n pollapo --unstable --allow-env --allow-net --allow-read --allow-write pbkit/cli/pollapo/entrypoint.ts
```


## 사용

### 로그인
pollapo는 github api를 사용해서 저장소를 내려받습니다.\
인증 정보를 얻어오기 위해 github cli 로그인을 합니다.
```sh
gh auth login
```

### 의존성 설치
의존성을 설치하고 싶은 저장소에서 다음과 같이 `pollapo.yml` 파일을 작성합니다.
```yml
deps:
  - riiid/interface-common-model@main
  - riiid/interface-inside-model@main
```

아래 명령을 실행하면 `.pollapo` 디렉토리가 만들어지고 거기에 의존성들이 설치됩니다.
```sh
pollapo install
```
