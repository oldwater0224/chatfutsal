// 오래된 알림 삭제 (개인정보 보관 기간 제한).
// 매일 도는 크론(/api/cron/close-expired-posts)에서 모집글 정리와 함께 실행한다.
// Vercel 무료 플랜의 크론 수 제한 때문에 별도 크론을 만들지 않았다.
import { commitWrites, queryCollection } from "./firestoreRest";

// 알림 보관 기간
export const NOTIFICATION_RETENTION_DAYS = 90;
// 한 번 조회·삭제하는 문서 수 (커밋 한 번의 최대 쓰기 수와 같다)
const PAGE_SIZE = 500;
// 한 번 실행에서 지우는 최대 문서 수. 남은 문서는 다음 날 실행에서 이어서 지운다
export const MAX_DELETES_PER_RUN = 2000;

// 이 시각보다 먼저 만든 알림을 지운다
export function notificationCutoff(now: Date, days = NOTIFICATION_RETENTION_DAYS): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export interface NotificationRetentionResult {
  deletedNotifications: number;
}

// createdAt(서버 Timestamp)이 기준 시각보다 이전인 알림을 지운다.
// createdAt 단일 필드 범위 조건만 써서 복합 색인이 필요 없다. createdAt이 없거나 null인 문서는 조회되지 않는다.
export async function deleteOldNotifications(
  now = new Date(),
  { maxDeletes = MAX_DELETES_PER_RUN } = {},
): Promise<NotificationRetentionResult> {
  const cutoff = notificationCutoff(now);
  let deleted = 0;

  while (deleted < maxDeletes) {
    const docs = await queryCollection(
      "notifications",
      [{ field: "createdAt", op: "LESS_THAN", value: cutoff }],
      { limit: Math.min(PAGE_SIZE, maxDeletes - deleted), select: [] },
    );
    if (docs.length === 0) break;

    await commitWrites(docs.map((d) => ({ delete: d.name })));
    deleted += docs.length;
  }

  return { deletedNotifications: deleted };
}
