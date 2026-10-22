import {
  autoId,
  commitWrites,
  documentPath,
  queryCollection,
  RestWrite,
} from "./firestoreRest";
import {
  ExpiredPostCandidate,
  kstDateString,
  needsCleanup,
  planCleanup,
  PostCleanupPlan,
} from "./expiredPosts";

// 하루 한 번 실행이 누락돼도 따라잡도록 최근 며칠치 경기를 다시 확인한다
const LOOKBACK_DAYS = 3;

const serverTime = (fieldPath: string) => ({ fieldPath, setToServerValue: "REQUEST_TIME" });

// 클라이언트의 closePendingApplications와 같은 결과가 되도록 쓴다:
// 모집글 마감 + applicantIds에서 대기 신청자 제거, 대기 신청 → closed, 신청자에게 recruit_closed 알림
export function buildCleanupWrites(plan: PostCleanupPlan): RestWrite[] {
  const applicantIds = plan.pending.map((app) => app.applicantId);

  const postWrite: RestWrite = {
    update: {
      name: documentPath("recruitPosts", plan.postId),
      fields: { status: { stringValue: "closed" } },
    },
    updateMask: { fieldPaths: ["status"] },
    updateTransforms: [
      serverTime("updatedAt"),
      ...(applicantIds.length > 0
        ? [
            {
              fieldPath: "applicantIds",
              removeAllFromArray: { values: applicantIds.map((id) => ({ stringValue: id })) },
            },
          ]
        : []),
    ],
    currentDocument: { exists: true },
  };

  const appWrites = plan.pending.flatMap((app): RestWrite[] => [
    {
      update: {
        name: documentPath("applications", app.id),
        fields: { status: { stringValue: "closed" } },
      },
      updateMask: { fieldPaths: ["status"] },
      updateTransforms: [serverTime("updatedAt")],
      currentDocument: { exists: true },
    },
    {
      update: {
        name: documentPath("notifications", autoId()),
        fields: {
          recipientId: { stringValue: app.applicantId },
          type: { stringValue: "recruit_closed" },
          title: { stringValue: "모집이 마감되었어요" },
          body: { stringValue: plan.postTitle },
          link: { stringValue: `/recruit/${plan.postId}` },
          isRead: { booleanValue: false },
        },
      },
      updateTransforms: [serverTime("createdAt")],
      currentDocument: { exists: false },
    },
  ]);

  return [postWrite, ...appWrites];
}

export interface CleanupResult {
  checked: number;
  closedPosts: number;
  closedApplications: number;
}

export async function closeExpiredPosts(now = new Date()): Promise<CleanupResult> {
  // date 단일 필드 범위 조건만 사용해 복합 색인 없이 동작한다
  const candidates = await queryCollection("recruitPosts", [
    { field: "date", op: "GREATER_THAN_OR_EQUAL", value: kstDateString(now, -LOOKBACK_DAYS) },
    { field: "date", op: "LESS_THAN_OR_EQUAL", value: kstDateString(now) },
  ]);

  const targets = candidates
    .map((doc) => ({ id: doc.id, ...doc.data }) as unknown as ExpiredPostCandidate)
    .filter((post) => needsCleanup(post, now));

  const result: CleanupResult = { checked: candidates.length, closedPosts: 0, closedApplications: 0 };

  // 글마다 따로 커밋해 한 글의 실패가 다른 글 정리를 막지 않게 한다
  for (const post of targets) {
    const apps = await queryCollection("applications", [
      { field: "postId", op: "EQUAL", value: post.id },
    ]);
    const pending = apps
      .filter((app) => app.data.status === "pending")
      .map((app) => ({ id: app.id, applicantId: app.data.applicantId as string }));

    const plan = planCleanup(post, pending);
    // 이미 마감된 글인데 실제 대기 신청이 없으면(카운트만 어긋난 경우) 쓸 것이 없다
    if (!plan.closePost && pending.length === 0) continue;
    await commitWrites(buildCleanupWrites(plan));
    if (plan.closePost) result.closedPosts++;
    result.closedApplications += pending.length;
  }

  return result;
}
