import { NextRequest, NextResponse } from "next/server";
import { IdTokenVerifierError, verifyIdToken } from "@/src/lib/server/idToken";
import { sendPushForNotifications } from "@/src/lib/server/pushJob";
import { parseNotificationIds } from "@/src/lib/server/pushRules";

// 클라이언트가 알림 문서를 만든 직후 호출한다 (docs/features/푸시알림.md 4장)
export const dynamic = "force-dynamic";

// 토큰 판정 결과. 서버 쪽 문제로 판정을 못 하면 바로 돌려줄 응답을 담는다
async function authenticate(request: NextRequest): Promise<{ uid: string | null } | { response: NextResponse }> {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!idToken) return { uid: null };
  try {
    return { uid: await verifyIdToken(idToken) };
  } catch (error) {
    // 스택 없이 원인만 남긴다
    if (error instanceof IdTokenVerifierError && error.kind === "unavailable") {
      console.error("푸시 인증 불가(일시 장애):", error.message);
      return { response: NextResponse.json({ error: "auth unavailable" }, { status: 503 }) };
    }
    if (error instanceof IdTokenVerifierError && error.kind === "config") {
      console.error("푸시 인증 설정 오류:", error.message);
    } else {
      console.error("푸시 인증 중 알 수 없는 오류:", error instanceof Error ? error.message : error);
    }
    return { response: NextResponse.json({ error: "server error" }, { status: 500 }) };
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if ("response" in auth) return auth.response;
  const { uid } = auth;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ids = parseNotificationIds(await request.json().catch(() => null));
  if (!ids) return NextResponse.json({ error: "invalid notificationIds" }, { status: 400 });

  try {
    const result = await sendPushForNotifications(ids, uid);
    return NextResponse.json(result);
  } catch (error) {
    console.error("푸시 발송 실패:", error);
    return NextResponse.json({ error: "push failed" }, { status: 500 });
  }
}
