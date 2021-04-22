# 엣지 케이스 정책

## 의존성 그래프에 같은 저장소의 여러 리비전이 존재할 때
버전 우선순위에 따라 해당 저장소의 최신 리비전을 선택합니다.

TODO: protobuf 스키마 선언 병합 기능 구현 예정

### 버전 우선순위
버전 우선순위란 두 리비전 중 어느쪽이 최신 버전인지를 판단하는 규칙입니다.

1. 두 리비전이 둘 다 [시맨틱 버저닝][semver]을 따를 경우에는 [시맨틱 버저닝의 우선순위 규칙][semver precedence]을 따릅니다.
2. A 리비전이 시맨틱 버저닝을 따르고 B 리비전은 시맨틱 버저닝을 따르지 않을 경우에는 B 리비전을 최신 버전으로 간주합니다.
3. 두 리비전이 둘 다 시맨틱 버저닝을 따르지 않을 경우에는 [ECMA262 - Abstract Relational Comparison][ecma262 arc] 규칙대로 비교합니다.
    - 흔히 영숫자 정렬(Alphanumeric sort)이라고 불리는 비교 알고리즘과 동일합니다.
    - `apple`과 `banana`를 비교하면 `banana`를 최신 버전으로 간주합니다.

[semver]: https://semver.org/lang/ko/
[semver precedence]: https://semver.org/lang/ko/#spec-item-11
[ecma262 arc]: https://tc39.es/ecma262/#sec-abstract-relational-comparison

## 다른 pollapo 저장소에 겹치는 경로의 protobuf 타입이 존재할 때
의존성 그래프에 `jongchan/hello` 저장소와 `jongchan/world` 저장소가 들어있다고 가정합시다.\
이 상황에서 `jongchan/hello` 저장소와, `jongchan/world` 저장소에서 둘 다 `foo.bar.Baz`라는 protobuf 메시지 선언이 들어있다면, 에러를 냅니다.
