// 닉네임 검증 (Firebase 의존성 없는 순수 함수)
// 수정 화면과 userService가 같은 규칙을 쓴다

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 12;

export type DisplayNameCheck =
  | { ok: true; value: string }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "unchanged" };

export function validateDisplayName(raw: string, current?: string | null): DisplayNameCheck {
  const value = raw.trim();
  // 이모지 등 서로게이트 쌍을 한 글자로 센다
  const length = Array.from(value).length;

  if (length < DISPLAY_NAME_MIN || length > DISPLAY_NAME_MAX) {
    return {
      ok: false,
      reason: "invalid",
      message: `닉네임은 ${DISPLAY_NAME_MIN}~${DISPLAY_NAME_MAX}자로 입력해주세요.`,
    };
  }
  if (value === current?.trim()) return { ok: false, reason: "unchanged" };

  return { ok: true, value };
}
