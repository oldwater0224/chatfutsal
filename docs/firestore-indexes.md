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
| `applications` | `postId` ↑, `createdAt` ↓ | 모집글별 신청 목록 |
| `applications` | `applicantId` ↑, `createdAt` ↓ | 내 신청 내역 |
| `notifications` | `recipientId` ↑, `createdAt` ↓ | 알림 목록 |
| `chatRooms` | `participants` (배열 포함), `lastMessageAt` ↓ | 채팅방 목록 |

`#66에서 추가`가 아닌 색인은 이미 콘솔에 있는 것을 파일에 함께 기록한 것이다.
배포해도 이미 있는 색인은 다시 만들지 않는다.

등호 조건만 있는 쿼리(안 읽은 알림 수, 서버 정리 작업의 `date` 범위 조회 등)는 단일 필드 색인으로 동작해
복합 색인이 필요 없다.

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
