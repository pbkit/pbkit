# core

## Convention

`core` 디렉토리 안에 들어있는 모듈들은 `deno-` 이름이 들어가는 파일이나 `.test.ts` 파일들을 제외하면 외부 의존성을 가져서는
안됩니다.

Modules in the `core` directory must not have external dependencies, except for
files named `deno-` or `.test.ts`.

node.js 등에서 쉽게 사용할 수 있도록 하기 위함입니다.

This is to make it easy to use in node.js, etc.
