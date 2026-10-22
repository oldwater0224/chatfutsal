// 서버(API Route·Cron)에서 쓰는 최소한의 Firestore REST 클라이언트.
// firebase-admin은 서버리스 런타임에서 ESM 문제(jose)가 있어, 커스텀 토큰과 같은 방식으로
// 서비스 계정 JWT를 직접 서명해 OAuth 액세스 토큰을 받는다.
// 서비스 계정 요청은 보안 규칙을 거치지 않으므로 서버 코드에서만 사용한다.
import { randomInt } from "crypto";
import jwt from "jsonwebtoken";

export type FirestoreValue =
  | string
  | number
  | boolean
  | null
  | Date
  | FirestoreValue[]
  | { [key: string]: FirestoreValue };

export interface RestDocument {
  name: string;
  id: string;
  data: Record<string, FirestoreValue>;
}

// REST Write (https://firebase.google.com/docs/firestore/reference/rest/v1/Write)
export type RestWrite = Record<string, unknown>;

const SCOPE = "https://www.googleapis.com/auth/datastore";
const COMMIT_LIMIT = 500;

let cachedToken: { value: string; expiresAt: number } | null = null;

function projectId(): string {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) throw new Error("Firebase 프로젝트 ID 환경 변수가 없습니다");
  return id;
}

function baseUrl(): string {
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  return emulator ? `http://${emulator}/v1` : "https://firestore.googleapis.com/v1";
}

export function databasePath(): string {
  return `projects/${projectId()}/databases/(default)`;
}

export function documentPath(collection: string, id: string): string {
  return `${databasePath()}/documents/${collection}/${id}`;
}

async function accessToken(): Promise<string> {
  // 에뮬레이터는 "owner" 토큰을 관리자 권한으로 취급한다
  if (process.env.FIRESTORE_EMULATOR_HOST) return "owner";
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Firebase 서비스 계정 환경 변수가 없습니다");

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 },
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
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore 요청 실패 (${path}): ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

// ===== 값 변환 =====

type RawValue = Record<string, unknown>;

export function encodeValue(value: FirestoreValue): RawValue {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  switch (typeof value) {
    case "string":
      return { stringValue: value };
    case "boolean":
      return { booleanValue: value };
    case "number":
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    default:
      return { mapValue: { fields: encodeFields(value) } };
  }
}

export function encodeFields(data: Record<string, FirestoreValue>): Record<string, RawValue> {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeValue(v)]));
}

export function decodeValue(raw: RawValue): FirestoreValue {
  if ("stringValue" in raw) return raw.stringValue as string;
  if ("integerValue" in raw) return Number(raw.integerValue);
  if ("doubleValue" in raw) return raw.doubleValue as number;
  if ("booleanValue" in raw) return raw.booleanValue as boolean;
  if ("timestampValue" in raw) return new Date(raw.timestampValue as string);
  if ("arrayValue" in raw) {
    const values = (raw.arrayValue as { values?: RawValue[] }).values ?? [];
    return values.map(decodeValue);
  }
  if ("mapValue" in raw) {
    return decodeFields((raw.mapValue as { fields?: Record<string, RawValue> }).fields ?? {});
  }
  return null;
}

export function decodeFields(fields: Record<string, RawValue>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
}

// ===== 조회·쓰기 =====

type FieldFilter = { field: string; op: "EQUAL" | "GREATER_THAN_OR_EQUAL" | "LESS_THAN_OR_EQUAL"; value: FirestoreValue };

// 컬렉션에서 AND 조건으로 문서를 조회한다
export async function queryCollection(
  collectionId: string,
  filters: FieldFilter[],
): Promise<RestDocument[]> {
  const fieldFilters = filters.map((f) => ({
    fieldFilter: { field: { fieldPath: f.field }, op: f.op, value: encodeValue(f.value) },
  }));
  const where =
    fieldFilters.length === 1 ? fieldFilters[0] : { compositeFilter: { op: "AND", filters: fieldFilters } };

  const rows = await request<{ document?: { name: string; fields?: Record<string, RawValue> } }[]>(
    `${databasePath()}/documents:runQuery`,
    { structuredQuery: { from: [{ collectionId }], where } },
  );

  return rows
    .filter((row) => row.document)
    .map(({ document }) => ({
      name: document!.name,
      id: document!.name.split("/").pop()!,
      data: decodeFields(document!.fields ?? {}),
    }));
}

// 500개 단위로 나눠 커밋한다. 앞쪽 쓰기가 먼저 반영된다.
export async function commitWrites(writes: RestWrite[]): Promise<void> {
  for (let i = 0; i < writes.length; i += COMMIT_LIMIT) {
    await request(`${databasePath()}/documents:commit`, { writes: writes.slice(i, i + COMMIT_LIMIT) });
  }
}

// Firestore 자동 ID와 같은 형식(20자)
export function autoId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 20; i++) id += chars[randomInt(chars.length)];
  return id;
}
