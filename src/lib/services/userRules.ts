// 닉네임 검증 (Firebase 의존성 없는 순수 함수)
// 수정 화면, 가입 화면, userService, 카카오 로그인 API, 푸시 발송이 같은 규칙을 쓴다.
// 보안 규칙(firestore.rules의 validName)도 같은 금지 문자를 막는다.

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 12;

// 다른 문서에 복사할 이름이 없을 때 쓰는 기본값 (보안 규칙이 이 값만 예외로 허용한다)
export const DEFAULT_COPIED_NAME = "사용자";

// 제어문자(C0, DEL), 보이지 않는 문자(U+200B, U+2060, U+FEFF), 방향 제어 문자(U+202A-202E, U+2066-2069).
// ZWJ(U+200D)는 이모지 조합에 쓰이므로 허용한다.
const FORBIDDEN_CHARS = /[\u0000-\u001F\u007F\u200B\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/;
const FORBIDDEN_CHARS_GLOBAL = new RegExp(FORBIDDEN_CHARS.source, "g");

export type DisplayNameCheck =
  | { ok: true; value: string }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "unchanged" };

// 이모지 등 서로게이트 쌍을 한 글자로 센다
function charCount(value: string): number {
  return Array.from(value).length;
}

export function validateDisplayName(raw: string, current?: string | null): DisplayNameCheck {
  const value = raw.trim();
  const length = charCount(value);

  if (length < DISPLAY_NAME_MIN || length > DISPLAY_NAME_MAX) {
    return {
      ok: false,
      reason: "invalid",
      message: `닉네임은 ${DISPLAY_NAME_MIN}~${DISPLAY_NAME_MAX}자로 입력해 주세요`,
    };
  }
  if (FORBIDDEN_CHARS.test(value)) {
    return {
      ok: false,
      reason: "invalid",
      message: "닉네임에 쓸 수 없는 문자가 들어 있어요",
    };
  }
  if (value === current?.trim()) return { ok: false, reason: "unchanged" };

  return { ok: true, value };
}

// 저장된 닉네임이 현재 규칙에 맞는지 (앞뒤 공백 없음, 2~12자, 금지 문자 없음)
export function isValidDisplayName(value: unknown): value is string {
  if (typeof value !== "string" || value !== value.trim()) return false;
  const length = charCount(value);
  return length >= DISPLAY_NAME_MIN && length <= DISPLAY_NAME_MAX && !FORBIDDEN_CHARS.test(value);
}

// 외부(카카오 프로필 등)에서 받은 이름을 최초 닉네임으로 다듬는다.
// 금지 문자를 지우고 앞뒤 공백을 없앤 뒤 12자로 자른다. 그래도 규칙에 맞지 않으면 fallback.
export function toInitialDisplayName(raw: unknown, fallback = "카카오 사용자"): string {
  if (typeof raw !== "string") return fallback;
  const cleaned = Array.from(raw.replace(FORBIDDEN_CHARS_GLOBAL, "").trim())
    .slice(0, DISPLAY_NAME_MAX)
    .join("")
    .trim();
  return isValidDisplayName(cleaned) ? cleaned : fallback;
}

// 모집글·신청·채팅방에 복사할 이름: users 문서의 닉네임 그대로, 없으면 기본값.
// 보안 규칙(copiedNameOf)이 users 문서 닉네임 또는 기본값만 허용한다.
export function nameForCopy(usersDocDisplayName: unknown): string {
  return typeof usersDocDisplayName === "string" && usersDocDisplayName
    ? usersDocDisplayName
    : DEFAULT_COPIED_NAME;
}
