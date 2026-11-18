import { NextRequest, NextResponse } from "next/server";
import { closeExpiredPosts } from "@/src/lib/server/expiredPostsJob";
import { deleteOldNotifications } from "@/src/lib/server/notificationRetention";

// Vercel Cron이 매일 호출한다 (vercel.json). 만료 모집글 정리와 오래된 알림(90일) 삭제를 함께 한다.
// 두 작업은 서로 독립이라 한쪽이 실패해도 다른 쪽은 실행한다. Vercel은 CRON_SECRET 환경 변수가 있으면
// Authorization: Bearer <CRON_SECRET> 헤더를 붙여 호출하므로, 같은 값인지 확인한다.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [posts, notifications] = await Promise.allSettled([
    closeExpiredPosts(),
    deleteOldNotifications(),
  ]);

  if (posts.status === "rejected") console.error("만료 모집글 정리 실패:", posts.reason);
  if (notifications.status === "rejected") console.error("오래된 알림 삭제 실패:", notifications.reason);

  const body = {
    ...(posts.status === "fulfilled" ? posts.value : { postsError: "cleanup failed" }),
    ...(notifications.status === "fulfilled"
      ? notifications.value
      : { notificationsError: "retention failed" }),
  };
  const failed = posts.status === "rejected" || notifications.status === "rejected";
  return NextResponse.json(body, { status: failed ? 500 : 200 });
}
