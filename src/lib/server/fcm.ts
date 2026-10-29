// FCM HTTP v1 발송 (서비스 계정 OAuth 토큰 사용)
import { accessToken, projectId, SCOPES } from "./googleAuth";
import { isStaleTokenError } from "./pushRules";

export type SendResult = "sent" | "stale" | "failed";

export async function sendFcmMessage(message: unknown): Promise<SendResult> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId()}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken(SCOPES.messaging)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  if (res.ok) return "sent";

  const body = await res.json().catch(() => null);
  if (isStaleTokenError(res.status, body)) return "stale";
  console.error("FCM 발송 실패:", res.status, JSON.stringify(body));
  return "failed";
}
