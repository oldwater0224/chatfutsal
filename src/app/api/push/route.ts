import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/src/lib/server/idToken";
import { sendPushForNotifications } from "@/src/lib/server/pushJob";
import { parseNotificationIds } from "@/src/lib/server/pushRules";

// 클라이언트가 알림 문서를 만든 직후 호출한다 (docs/features/푸시알림.md 4장)
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const uid = idToken ? await verifyIdToken(idToken) : null;
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
