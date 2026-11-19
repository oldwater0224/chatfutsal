// Firebase ID 토큰 검증 (firebase-admin의 verifyIdToken 대체)
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
import jwt from "jsonwebtoken";
import { projectId } from "./googleAuth";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
// 인증서 서버가 응답하지 않을 때 요청이 함수 제한 시간까지 매달리지 않게 한다
const CERTS_TIMEOUT_MS = 5_000;

// 토큰이 틀린 것이 아니라 서버 쪽 문제로 검증을 못 한 경우.
// config: 환경 변수 누락 등 설정 오류, unavailable: 공개 인증서 조회 실패 등 일시적 장애
export class IdTokenVerifierError extends Error {
  constructor(
    readonly kind: "config" | "unavailable",
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "IdTokenVerifierError";
  }
}

let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

// 테스트에서 인증서 캐시를 비운다
export function resetIdTokenCertCache(): void {
  cachedCerts = null;
}

async function publicCerts(): Promise<Record<string, string>> {
  if (cachedCerts && cachedCerts.expiresAt > Date.now()) return cachedCerts.certs;

  try {
    const res = await fetch(CERTS_URL, { signal: AbortSignal.timeout(CERTS_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const certs = (await res.json()) as Record<string, string>;
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
    cachedCerts = { certs, expiresAt: Date.now() + maxAge * 1000 };
    return certs;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new IdTokenVerifierError("unavailable", `공개 인증서 조회 실패: ${reason}`, { cause: error });
  }
}

function configuredProjectId(): string {
  try {
    return projectId();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new IdTokenVerifierError("config", reason, { cause: error });
  }
}

// 유효하면 uid, 토큰이 잘못됐으면 null.
// 설정 오류나 인증서 조회 실패처럼 토큰을 판정할 수 없으면 IdTokenVerifierError를 던진다.
export async function verifyIdToken(token: string): Promise<string | null> {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header.kid;
  if (!kid) return null;

  const pid = configuredProjectId();
  const cert = (await publicCerts())[kid];
  if (!cert) return null;

  try {
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
