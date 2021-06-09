# pollapo
pollapo는 [Protobuf][protobuf] 의존성 관리 도구입니다.

[protobuf]: https://developers.google.com/protocol-buffers


## 설치
### 전제조건
- [git](https://git-scm.com/)
- [deno](https://deno.land/) 1.8.0 이상

### Homebrew로 설치하기

(이렇게 설치할 경우 deno는 직접 설치할 필요 없습니다)
```sh
brew tap riiid/riiid
brew install pollapo
```

### 직접 빌드하기

```sh
# pbkit 저장소를 클론받습니다.
git clone git@github.com:riiid/pbkit.git

# pollapo 명령어를 설치합니다.
deno install -n pollapo -A --unstable pbkit/cli/pollapo/entrypoint.ts
```


## 사용

### 로그인
pollapo는 github api를 사용해서 저장소를 내려받습니다.\
인증 정보를 얻어오기 위해 github 계정으로 로그인을 합니다.
```sh
pollapo login
```

### 의존성 설치
의존성을 설치하고 싶은 디렉토리에서 다음과 같이 명령을 실행합니다.
```sh
# 원하는 의존성 추가
pollapo add riiid/interface-common-model riiid/interface-inside-model

# 의존성 설치
pollapo install # 생성된 `.pollapo` 디렉토리 확인
```
