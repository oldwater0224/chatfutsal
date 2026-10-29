// 알림 문서 → 웹 푸시 발송 (docs/features/푸시알림.md)
// /api/push(클라이언트가 만든 알림)와 크론(서버가 만든 알림)이 함께 쓴다.
import { sendFcmMessage } from "./fcm";
import { commitWrites, documentPath, getDocuments, listDocuments } from "./firestoreRest";
import { buildPushMessage, shouldPush } from "./pushRules";

export interface PushResult {
  notifications: number;
  sent: number;
  staleTokens: number;
}

// 다른 요청이 먼저 pushedAt을 기록했으면 updateTime 사전 조건이 실패한다 → false
async function claimNotification(name: string, updateTime: string): Promise<boolean> {
  try {
    await commitWrites([
      {
        transform: {
          document: name,
          fieldTransforms: [{ fieldPath: "pushedAt", setToServerValue: "REQUEST_TIME" }],
        },
        currentDocument: { updateTime },
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

// callerId: 클라이언트 요청이면 호출자 uid, 크론이면 null
export async function sendPushForNotifications(
  notificationIds: string[],
  callerId: string | null,
  now = new Date(),
): Promise<PushResult> {
  const result: PushResult = { notifications: 0, sent: 0, staleTokens: 0 };
  const docs = await getDocuments(notificationIds.map((id) => documentPath("notifications", id)));

  for (const doc of docs) {
    if (!shouldPush(doc.data, callerId, now) || !doc.updateTime) continue;
    if (!(await claimNotification(doc.name, doc.updateTime))) continue;
    result.notifications++;

    const recipientId = doc.data.recipientId as string;
    const tokens = await listDocuments(documentPath("users", recipientId), "fcmTokens");
    const stale: string[] = [];

    await Promise.all(
      tokens.map(async (tokenDoc) => {
        const outcome = await sendFcmMessage(buildPushMessage(tokenDoc.id, doc.id, doc.data));
        if (outcome === "sent") result.sent++;
        if (outcome === "stale") stale.push(tokenDoc.name);
      }),
    );

    if (stale.length > 0) {
      await commitWrites(stale.map((name) => ({ delete: name })));
      result.staleTokens += stale.length;
    }
  }

  return result;
}
