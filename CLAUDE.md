# chatfutsal 작업 규칙

CLI·데스크톱 앱·클라우드 에이전트 등 실행 환경과 관계없이 모든 세션이 따른다.

## 브랜치와 머지 흐름

`master`는 배포 브랜치(Vercel 프로덕션)다. 모든 변경은 `develop`을 거쳐서만 `master`에 들어간다.

```
작업 브랜치 ──PR──▶ develop ──(리뷰·검증·디버깅)──▶ 릴리스 PR ──▶ master
```

1. **작업 브랜치는 `develop`에서 만든다.** 이름은 `feat/…`, `fix/…`, `perf/…`, `refactor/…`, `chore/…`, `docs/…`
2. **PR의 base는 항상 `develop`이다.** `gh pr create --base develop …`
   - 작업 브랜치에서 `master`로 바로 PR을 만들거나 머지하지 않는다
   - `master`에 직접 커밋·푸시하지 않는다
3. **`develop`에서 검증한다.** 릴리스 전에 다음을 모두 통과해야 한다
   - 코드 리뷰 (`/code-review`), 지적된 문제 수정
   - `npm test`, `npx tsc --noEmit`, `npm run lint`
   - `firestore.rules`나 규칙 테스트가 바뀌었으면 `npm run test:rules`
   - Vercel Preview 배포 성공, 오류가 있으면 디버깅해서 `develop`에서 고친다
   - `firestore.indexes.json`이 바뀌었으면 `npm run deploy:indexes -- --project chatfutsal2`로 배포하고 색인이 READY가 된 것을 확인 (`docs/firestore-indexes.md`)
4. **문제가 없을 때만 릴리스 PR(`develop` → `master`)을 만들어 머지한다.**
   - 이슈는 기본 브랜치(`master`)에 머지될 때만 자동으로 닫힌다. 릴리스 PR 본문에 이번에 포함된 이슈를 `Closes #N`으로 모두 적는다
5. **릴리스 머지 후 `develop`을 `master`에 맞춘다.**
   ```bash
   git checkout develop && git pull && git merge --ff-only origin/master && git push origin develop
   ```

## 서브에이전트 운영 규칙 (필수)

사용자가 정한 상시 지시다. 매번 요청이 없어도 서브에이전트 사용을 지시받은 것으로 보고, 세션이 바뀌어도, 작업이 작아도 생략하지 않는다.

1. **적용 범위**: 코드·설정·문서 변경, 코드 조사, 에러 분석·디버깅 요청마다 적용한다. 코드를 보지 않고 답할 수 있는 질문, 커밋·PR 같은 git 절차만 제외한다.
2. **요청마다 서브에이전트 3개를 실행하고 각각 작업을 할당한다.**

   | 역할 | 에이전트 | 담당 |
   |---|---|---|
   | 화면 | `ui-builder` | 페이지, 컴포넌트, 스타일, 반응형 |
   | 로직 | `logic-builder` | hooks, services, API 라우트, Firestore 쿼리·규칙·색인, 테스트 |
   | 에러·디버깅 | `debugger` | 재현, 원인 분석, 수정, `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` 검증 |

   - 정의는 `.claude/agents/`에 있다. 커스텀 타입이 등록되지 않았거나 정의 파일이 없으면 general-purpose 에이전트에게 위 역할을 지시한다(파일이 있으면 읽고 따르게 한다).
   - 어느 역할에 바꿀 것이 없어도 실행한다. 영향 범위를 확인하고 "변경 없음"과 근거를 보고하게 한다.
3. **메인 에이전트는 조율과 보고만 한다.** 작업 분해·할당, 결과 취합, 사용자 보고를 맡고 코드를 직접 조사하거나 수정하지 않는다. 커밋·푸시·PR은 이 문서의 다른 규칙대로 메인 에이전트가 맡는다.
4. **충돌 방지**: `ui-builder`와 `logic-builder`를 동시에 돌릴 때는 메인 에이전트가 먼저 인터페이스(함수 시그니처, 라우트, 파라미터)와 담당 파일을 정해 주고, 서로의 파일은 건드리지 않게 한다. `debugger`는 두 작업이 끝난 뒤 마지막에 검증한다. 에러 수정 요청이면 `debugger`의 원인 분석을 먼저 실행한다.
5. **서브에이전트 보고**: 각 서브에이전트는 정의 파일의 보고 형식에 **주요 변경과 이유**(무엇을 왜 바꿨는지, 다른 방법 대신 이 방법을 고른 이유)를 포함해 메인 에이전트에 보고한다.
6. **메인 에이전트의 최종 보고**: 작업이 끝나면 사용자에게 아래 네 항목을 모두 보고한다.
   - 역할별 결과 요약
   - 주요 변경과 그 이유
   - 검증 결과, 남은 위험
   - 소모 토큰: `python3 ~/.claude/scripts/token-report.py "$PWD"` 를 실행해 에이전트별 표를 그대로 싣는다. 표는 세션 누적값이고 세션 기록에서 집계한 실측값이다. 추정값을 쓰지 않는다. 스크립트나 세션 기록이 없는 환경이면 "측정 불가"라고 적는다.
