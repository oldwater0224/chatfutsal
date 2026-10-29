// 푸시 발송 판정과 메시지 생성 (네트워크 의존성 없는 순수 함수)
// docs/features/푸시알림.md 4장

export const PUSH_MAX_AGE_MS = 2 * 60 * 1000;
export const PUSH_MAX_IDS = 50;

export interface PushNotificationDoc {
  recipientId?: unknown;
  title?: unknown;
  body?: unknown;
  link?: unknown;
  createdAt?: unknown;
  pushedAt?: unknown;
}

// 방금 생겨 아직 보내지 않은, 다른 사람에게 가는 알림만 보낸다
export function shouldPush(doc: PushNotificationDoc, callerId: string | null, now: Date): boolean {
  if (typeof doc.recipientId !== "string" || !doc.recipientId) return false;
  if (doc.pushedAt != null) return false;
  if (!(doc.createdAt instanceof Date)) return false;
  const age = now.getTime() - doc.createdAt.getTime();
  // 서버·클라이언트 시계 차이를 고려해 약간의 미래 시각은 허용한다
  if (age > PUSH_MAX_AGE_MS || age < -PUSH_MAX_AGE_MS) return false;
  // 크론(서버)이 보낼 때는 호출자가 없다
  if (callerId !== null && doc.recipientId === callerId) return false;
  return true;
}

// 요청 본문에서 알림 ID 목록을 꺼낸다 (중복 제거, 최대 개수 제한)
export function parseNotificationIds(body: unknown): string[] | null {
  const ids = (body as { notificationIds?: unknown } | null)?.notificationIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > PUSH_MAX_IDS) return null;
  if (!ids.every((id) => typeof id === "string" && /^[A-Za-z0-9]{1,64}$/.test(id))) return null;
  return [...new Set(ids as string[])];
}

// "/chat/x" 같은 앱 내부 경로만 허용 ("//host", "/\host"는 다른 출처로 해석된다)
function isInternalPath(link: unknown): link is string {
  return typeof link === "string" && link.startsWith("/") && !link.startsWith("//") && !link.includes("\\");
}

export function buildPushMessage(token: string, notificationId: string, doc: PushNotificationDoc) {
  return {
    message: {
      token,
      data: {
        title: String(doc.title ?? ""),
        body: String(doc.body ?? ""),
        link: isInternalPath(doc.link) ? doc.link : "/notifications",
        notificationId,
      },
      webpush: { headers: { Urgency: "high", TTL: "86400" } },
    },
  };
}

// FCM이 이 응답을 주면 토큰이 더는 쓸 수 없으므로 지운다
// https://firebase.google.com/docs/reference/fcm/rest/v1/ErrorCode
export function isStaleTokenError(status: number, errorBody: unknown): boolean {
  const error = (
    errorBody as { error?: { status?: string; message?: string; details?: { errorCode?: string }[] } } | null
  )?.error;
  const codes = [error?.status, ...(error?.details ?? []).map((d) => d.errorCode)];
  if (codes.includes("UNREGISTERED")) return true;
  // 토큰 형식이 틀린 경우는 INVALID_ARGUMENT로 온다. 메시지 형식 오류도 같은 코드라
  // 메시지 문구로 토큰 문제인지 구분한다 (형식 버그로 정상 토큰을 지우지 않게)
  return (
    status === 400 &&
    codes.includes("INVALID_ARGUMENT") &&
    /registration token/i.test(error?.message ?? "")
  );
}
