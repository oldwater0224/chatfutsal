# Firestore 복합 색인 배포

앱이 쓰는 복합 색인은 `firestore.indexes.json`에서 관리한다. 색인이 없으면 해당 쿼리가
`failed-precondition`(The query requires an index) 오류로 실패한다.

## 색인 목록

| 컬렉션 | 필드 | 쓰는 곳 |
|--------|------|---------|
| `recruitPosts` | `status` ↑, `createdAt` ↓ | 모집글 목록 (필터 없음) |
| `recruitPosts` | `status` ↑, `date` ↑, `createdAt` ↓ | 모집글 목록 (날짜 필터) — **#66에서 추가** |
| `recruitPosts` | `status` ↑, `level` ↑, `createdAt` ↓ | 모집글 목록 (실력 필터) — **#66에서 추가** |
| `recruitPosts` | `status` ↑, `date` ↑, `level` ↑, `createdAt` ↓ | 모집글 목록 (날짜+실력) — **#66에서 추가** |
| `recruitPosts` | `authorId` ↑, `createdAt` ↓ | 내 모집글 |
| `applications` | `postId` ↑, `createdAt` ↓ | **쓰지 않음** (아래 참고) |
| `applications` | `postId` ↑, `authorId` ↑, `createdAt` ↓ | 모집글별 신청 목록 - 작성자 (`usePostApplications`) — **신청 읽기 제한에서 추가** |
| `applications` | `postId` ↑, `applicantId` ↑, `createdAt` ↓ | 모집글의 내 신청 - 신청자 (`usePostApplications`) — **신청 읽기 제한에서 추가** |
| `applications` | `applicantId` ↑, `createdAt` ↓ | 내 신청 내역 |
| `notifications` | `recipientId` ↑, `createdAt` ↓ | 알림 목록 |
| `chatRooms` | `participants` (배열 포함), `lastMessageAt` ↓ | 채팅방 목록 |

`#66에서 추가`, `신청 읽기 제한에서 추가`가 아닌 색인은 이미 콘솔에 있는 것을 파일에 함께 기록한 것이다.
배포해도 이미 있는 색인은 다시 만들지 않는다.

`applications`의 `postId` ↑, `createdAt` ↓는 신청 문서를 신청자·작성자만 읽게 규칙을 바꾸면서 쓰는 곳이 없어졌다
(`postId`만 거는 목록 쿼리는 규칙에 거부된다). 새 규칙을 배포하기 전까지는 예전 클라이언트가 쓰고,
규칙을 되돌릴 때도 필요하므로 이번 릴리스에서는 파일과 콘솔에 남겨 둔다.
새 규칙이 안정된 뒤 별도 변경에서 파일에서 지우고 콘솔에서 그 색인만 직접 삭제한다
(아래 4번처럼 배포 중 삭제를 물으면 No를 고르는 원칙은 그대로 둔다).

등호 조건만 있는 쿼리(안 읽은 알림 수, 작성자의 신청 정리·삭제용 `postId`+`authorId` 조회 등)와
단일 필드 범위 쿼리(서버 정리 작업의 `date` 범위, 오래된 알림 삭제의 `createdAt` 범위)는
단일 필드 색인으로 동작해 복합 색인이 필요 없다.

## 로컬에서 배포하기

1. 프로젝트 ID 확인: `.env.local`의 `NEXT_PUBLIC_FIREBASE_PROJECT_ID` 값
2. Firebase 로그인 (처음 한 번, 브라우저가 열림)
   ```bash
   npx -y firebase-tools@14 login
   ```
3. 색인 배포 (`<프로젝트 ID>`를 1번 값으로 바꿔서)
   ```bash
   npm run deploy:indexes -- --project <프로젝트 ID>
   ```
4. 배포 중 **"콘솔에는 있지만 파일에는 없는 색인을 삭제할까요?"** 라고 물으면 **No**를 고른다.
   이 파일에 앱이 쓰는 색인을 모두 적어 두었으므로 보통은 묻지 않는다. 묻는다면 콘솔에서 직접 만든
   다른 색인이 있다는 뜻이니 지우지 않는다
5. Firebase 콘솔 → Firestore Database → 색인 → 복합에서 새 색인 3개의 상태가
   **빌드 중 → 사용 설정됨**으로 바뀌는지 확인한다 (데이터 양에 따라 몇 분)

## 콘솔에서 직접 만들기 (CLI를 쓰지 않을 때)

Firestore Database → 색인 → 복합 → 색인 만들기에서 위 표의 `#66에서 추가` 3개를 만든다.
컬렉션 ID `recruitPosts`, 쿼리 범위 `컬렉션`, 필드는 표의 순서와 방향 그대로 입력한다.

또는 색인이 없는 상태에서 앱에서 날짜·실력 필터를 골라 보면, 브라우저 콘솔의 오류 메시지에
`You can create it here: https://console.firebase.google.com/...` 링크가 나온다. 링크를 열고 만들기를 누르면 된다
(날짜만, 실력만, 둘 다 — 세 경우를 각각).

## 확인

- 형식 검증: `firebase-tools`의 색인 검증기로 이 파일을 확인했다 (9개 통과)
- 에뮬레이터는 색인을 검사하지 않으므로, 실제 동작은 배포한 뒤 앱에서 날짜·실력 필터를 골라 확인한다

## 보안 규칙 배포

`firebase.json`이 규칙 파일(`firestore.rules`)과 색인 파일을 가리킨다. 규칙 배포 npm 스크립트와 CI는 없으므로
로컬에서 직접 배포한다 (Firebase 로그인은 위 2번과 같음).

```bash
npx -y firebase-tools@14 deploy --only firestore:rules --project chatfutsal2
```

규칙은 배포 즉시(1분 안팎) 적용된다. 되돌릴 때는 이전 커밋의 `firestore.rules`로 다시 배포하거나
Firebase 콘솔 → Firestore Database → 규칙 → 기록에서 이전 버전을 게시한다.

## 릴리스 순서 (색인 → 클라이언트 → 규칙)

쿼리 조건을 좁히는 규칙 변경(예: 신청 읽기 제한)은 새 쿼리가 쓸 색인과 새 클라이언트가 먼저 나가 있어야
목록이 깨지지 않는다.

1. `npm run test:rules` 통과 확인 (`develop`)
2. 색인 배포: `npm run deploy:indexes -- --project chatfutsal2`
3. 콘솔에서 새 색인이 모두 **사용 설정됨(READY)** 인지 확인
4. 릴리스 PR(`develop` → `master`) 머지 → Vercel 프로덕션 배포 완료 확인
5. 규칙 배포: `npx -y firebase-tools@14 deploy --only firestore:rules --project chatfutsal2`
6. 프로덕션에서 확인: 작성자로 신청 현황, 신청자로 신청 취소·내 신청 내역, 닉네임 변경
7. (필요할 때) 1회용 데이터 정리 스크립트 실행 (예: `scripts/cleanup-user-pii.mjs`, dry-run 먼저)

5 이후 배포 전부터 열려 있던 탭(예전 클라이언트)은 신청 목록이 새 규칙에 막힐 수 있다. 새로고침하면 해결된다.
