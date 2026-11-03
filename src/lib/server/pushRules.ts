// 푸시 발송 판정과 메시지 생성 (네트워크 의존성 없는 순수 함수)
// docs/features/푸시알림.md 4장

export const PUSH_MAX_AGE_MS = 2 * 60 * 1000;
export const PUSH_MAX_IDS = 50;

export interface PushNotificationDoc {
  recipientId?: unknown;
  senderId?: unknown;
  type?: unknown;
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
  if (callerId === null) return true;
  if (doc.recipientId === callerId) return false;
  // 클라이언트 요청은 호출자가 만든 알림만 보낸다 (senderId는 보안 규칙이 작성자 uid로 강제)
  return doc.senderId === callerId;
}

// 클라이언트가 만든 알림의 title은 작성자가 마음대로 쓸 수 있으므로 푸시에 쓰지 않는다.
// 대신 알림 종류와 보낸 사람의 현재 닉네임(users 문서)으로 서버가 제목을 만든다.
const CLIENT_PUSH_TITLES: Record<string, (name: string) => string> = {
  new_message: (name) => `${name}님의 새 메시지`,
  application_received: (name) => `${name}님이 참가 신청했어요`,
  application_accepted: (name) => `${name}님이 참가 신청을 수락했어요`,
  application_rejected: (name) => `${name}님이 참가 신청을 거절했어요`,
  recruit_deleted: (name) => `${name}님이 모집을 취소했어요`,
  recruit_closed: (name) => `${name}님의 모집이 마감되었어요`,
};

export const PUSH_BODY_MAX = 100;

// 알 수 없는 종류면 null (보내지 않는다)
export function clientPushTitle(type: unknown, senderName: string): string | null {
  const template = typeof type === "string" ? CLIENT_PUSH_TITLES[type] : undefined;
  return template ? template(senderName) : null;
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

// title: 서버가 정한 제목 (크론 알림은 doc.title, 클라이언트 알림은 clientPushTitle)
export function buildPushMessage(
  token: string,
  notificationId: string,
  doc: PushNotificationDoc,
  title: string,
) {
  return {
    message: {
      token,
      data: {
        title,
        body: Array.from(String(doc.body ?? "")).slice(0, PUSH_BODY_MAX).join(""),
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
