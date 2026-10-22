import { NextRequest, NextResponse } from "next/server";
import { closeExpiredPosts } from "@/src/lib/server/expiredPostsJob";

// Vercel Cron이 호출한다 (vercel.json). Vercel은 CRON_SECRET 환경 변수가 있으면
// Authorization: Bearer <CRON_SECRET> 헤더를 붙여 호출하므로, 같은 값인지 확인한다.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await closeExpiredPosts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("만료 모집글 정리 실패:", error);
    return NextResponse.json({ error: "cleanup failed" }, { status: 500 });
  }
}
