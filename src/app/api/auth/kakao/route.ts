import { NextRequest, NextResponse } from "next/server";
import { createCustomToken } from "@/src/lib/firebase-admin";

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "인가 코드가 필요합니다" },
        { status: 400 },
      );
    }

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!,
        code,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "카카오 토큰 발급 실패" },
        { status: 401 },
      );
    }

    const tokenData: KakaoTokenResponse = await tokenRes.json();

    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "카카오 사용자 정보 조회 실패" },
        { status: 401 },
      );
    }

    const kakaoUser: KakaoUserResponse = await userRes.json();
    const uid = `kakao_${kakaoUser.id}`;
    const nickname =
      kakaoUser.kakao_account?.profile?.nickname ?? "카카오 사용자";
    const profileImage =
      kakaoUser.kakao_account?.profile?.profile_image_url ?? null;

    const firebaseToken = createCustomToken(uid);

    return NextResponse.json({
      token: firebaseToken,
      user: { uid, nickname, profileImage },
    });
  } catch (error) {
    console.error("카카오 로그인 에러:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
