// 알림 문서 → 웹 푸시 발송 (docs/features/푸시알림.md)
// /api/push(클라이언트가 만든 알림)와 크론(서버가 만든 알림)이 함께 쓴다.
import { sendFcmMessage } from "./fcm";
import {
  commitWrites,
  documentPath,
  FirestoreRequestError,
  getDocuments,
  queryCollection,
  RestDocument,
} from "./firestoreRest";
import { buildPushMessage, clientPushTitle, shouldPush } from "./pushRules";

export interface PushResult {
  notifications: number;
  sent: number;
  staleTokens: number;
  // 처리 중 오류가 난 알림 수 (로그에 원인이 남는다)
  errors: number;
}

// 다른 요청이 먼저 pushedAt을 기록했으면 updateTime 사전 조건이 실패한다 → false
// 그 밖의 오류(네트워크, 권한, 5xx)는 던져서 호출한 쪽이 기록하게 한다
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
  } catch (error) {
    if (error instanceof FirestoreRequestError && error.isPreconditionFailure) return false;
    throw error;
  }
}

// 클라이언트 알림의 푸시 제목에 쓸 보낸 사람 닉네임 (users 문서 기준)
async function senderName(uid: string): Promise<string | null> {
  const [user] = await getDocuments([documentPath("users", uid)]);
  const name = user?.data.displayName;
  return typeof name === "string" && name ? name : null;
}

// 알림 하나를 발송한다. 다른 요청이 이미 맡았으면 아무것도 하지 않는다
// pushedAt을 먼저 기록하므로 FCM 발송이 실패해도 다시 보내지 않는다 (중복 발송보다 누락을 택함)
async function pushOne(doc: RestDocument, title: string, result: PushResult): Promise<void> {
  if (!(await claimNotification(doc.name, doc.updateTime!))) return;
  result.notifications++;

  const tokens = await queryCollection("fcmTokens", [
    { field: "uid", op: "EQUAL", value: doc.data.recipientId as string },
  ]);
  const stale: string[] = [];
  let failed = 0;

  await Promise.all(
    tokens.map(async (tokenDoc) => {
      const outcome = await sendFcmMessage(buildPushMessage(tokenDoc.id, doc.id, doc.data, title));
      if (outcome === "sent") result.sent++;
      if (outcome === "stale") stale.push(tokenDoc.name);
      if (outcome === "failed") failed++;
    }),
  );
  if (failed > 0) console.error(`푸시 일부 실패 (알림 ${doc.id}): 토큰 ${failed}/${tokens.length}개`);

  if (stale.length > 0) {
    await commitWrites(stale.map((name) => ({ delete: name })));
    result.staleTokens += stale.length;
  }
}

// callerId: 클라이언트 요청이면 호출자 uid, 크론이면 null
export async function sendPushForNotifications(
  notificationIds: string[],
  callerId: string | null,
  now = new Date(),
): Promise<PushResult> {
  const result: PushResult = { notifications: 0, sent: 0, staleTokens: 0, errors: 0 };
  const docs = await getDocuments(notificationIds.map((id) => documentPath("notifications", id)));
  const targets = docs.filter((doc) => shouldPush(doc.data, callerId, now) && doc.updateTime);
  if (targets.length === 0) return result;

  // 클라이언트가 만든 알림은 저장된 title 대신 서버가 만든 제목을 쓴다 (pushRules.clientPushTitle)
  const name = callerId === null ? null : await senderName(callerId);
  if (callerId !== null && !name) return result;

  for (const doc of targets) {
    const title = name === null ? String(doc.data.title ?? "") : clientPushTitle(doc.data.type, name);
    if (!title) continue;
    try {
      await pushOne(doc, title, result);
    } catch (error) {
      // 한 알림의 오류로 나머지 알림 발송을 멈추지 않는다
      result.errors++;
      console.error(`푸시 처리 실패 (알림 ${doc.id}):`, error);
    }
  }

  return result;
}
