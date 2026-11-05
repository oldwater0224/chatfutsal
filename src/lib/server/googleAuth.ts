// 서비스 계정 JWT를 직접 서명해 Google OAuth 액세스 토큰을 받는다 (firebase-admin 대신).
// Firestore REST와 FCM이 범위(scope)별로 토큰을 캐시해 함께 쓴다.
import jwt from "jsonwebtoken";

export const SCOPES = {
  datastore: "https://www.googleapis.com/auth/datastore",
  messaging: "https://www.googleapis.com/auth/firebase.messaging",
} as const;

const cachedTokens = new Map<string, { value: string; expiresAt: number }>();

export function projectId(): string {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) throw new Error("Firebase 프로젝트 ID 환경 변수가 없습니다");
  return id;
}

export async function accessToken(scope: string): Promise<string> {
  const cached = cachedTokens.get(scope);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Firebase 서비스 계정 환경 변수가 없습니다");

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 },
    privateKey,
    { algorithm: "RS256" },
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`액세스 토큰 발급 실패: ${res.status}`);

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedTokens.set(scope, { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 });
  return body.access_token;
}
