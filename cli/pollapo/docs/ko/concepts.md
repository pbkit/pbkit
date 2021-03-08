# 개념정리

## 호스트
저장소들이 들어있는 서비스를 의미합니다.\
pollapo는 호스트가 `github.com` 하나만 존재한다고 상정합니다.


## 저장소
호스트에 등록돼있는 git 저장소를 의미합니다.\
사용자 이름과 저장소 이름의 쌍으로 하나의 저장소를 가르킬 수 있습니다.\
사용자 이름이 다르면 저장소 이름이 같아도 다른 저장소로 간주합니다.\
`user-a/repo` 와 `user-b/repo`는 다른 저장소입니다.


## 리비전
특정 저장소의 특정 상태를 의미합니다.\
저장소 주소에 커밋 해시 또는 브랜치 이름 또는 태그 이름을 붙여서 가르킬 수 있습니다.\
예시) `user/repo@v1.0.0`

같은 git 리비전을 바라보더라도 이름이 다르다면 다른 pollapo 리비전으로 간주합니다.

예를 들어 `riiid/interface-common-model@master`가 바라보는 커밋해시가 `eaed54c`이어도,\
pollapo에서는 `riiid/interface-common-model@eaed54c`와는 다른 리비전으로 간주합니다.

마찬가지로
`riiid/interface-common-model@eaed54c`는\
`riiid/interface-common-model@eaed54cbc9a4db`와 다른 리비전입니다.


## 의존성
리비전에 들어있는 `pollapo.yml` 파일의 `deps` 필드에 들어있는 주소가 가르키는 다른 리비전을 의미합니다.
