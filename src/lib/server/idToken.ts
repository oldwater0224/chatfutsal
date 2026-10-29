// Firebase ID 토큰 검증 (firebase-admin의 verifyIdToken 대체)
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
import jwt from "jsonwebtoken";
import { projectId } from "./googleAuth";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function publicCerts(): Promise<Record<string, string>> {
  if (cachedCerts && cachedCerts.expiresAt > Date.now()) return cachedCerts.certs;

  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`공개 인증서 조회 실패: ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  cachedCerts = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

// 유효하면 uid, 아니면 null
export async function verifyIdToken(token: string): Promise<string | null> {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header.kid;
  if (!kid) return null;

  const cert = (await publicCerts())[kid];
  if (!cert) return null;

  try {
    const pid = projectId();
    const payload = jwt.verify(token, cert, {
      algorithms: ["RS256"],
      audience: pid,
      issuer: `https://securetoken.google.com/${pid}`,
    }) as jwt.JwtPayload;
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
