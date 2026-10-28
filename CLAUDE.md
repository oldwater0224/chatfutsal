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
