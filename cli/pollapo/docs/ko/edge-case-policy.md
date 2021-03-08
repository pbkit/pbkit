# 엣지 케이스 정책

## 의존성 그래프에 같은 저장소의 여러 리비전이 존재할 때
해당 저장소의 최신 리비전을 선택합니다.

TODO: 최신 리비전 선택하는 기준 설명\
TODO: protobuf 스키마 선언 병합 기능 구현 예정


## 다른 pollapo 저장소에 겹치는 경로의 protobuf 타입이 존재할 때
의존성 그래프에 `jongchan/hello` 저장소와 `jongchan/world` 저장소가 들어있다고 가정합시다.\
이 상황에서 `jongchan/hello` 저장소와, `jongchan/world` 저장소에서 둘 다 `foo.bar.Baz`라는 protobuf 메시지 선언이 들어있다면, 에러를 냅니다.
