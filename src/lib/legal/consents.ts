// 가입 시 받는 동의 항목 정의 (Firebase 의존성 없는 순수 모듈)
//
// - 개인정보 수집·이용 "필수 동의"는 받지 않는다. 2023.9.15 개정 개인정보 보호법에 따라
//   서비스 제공에 필요한 정보는 계약 이행 근거(제15조 제1항 제4호)로 처리하므로
//   개인정보 처리방침 고지(PRIVACY_NOTICE)로 갈음한다.
// - 만 14세 미만은 법정대리인 동의(제22조의2)가 필요하므로 가입을 받지 않는다 → "age14" 확인.
// - 이용약관은 계약이므로 동의를 받는다 → "terms".
// - 선택 동의(마케팅 수신)는 광고성 정보를 보내지 않으므로 두지 않는다.
//
// 약관·처리방침 내용을 바꾸면 버전을 올린다. 동의 기록에 이 버전을 함께 저장한다.

export const TERMS_VERSION = "2026-11-18";
export const PRIVACY_VERSION = "2026-11-18";

export type RequiredConsentId = "age14" | "terms";

export interface ConsentItem {
  id: RequiredConsentId;
  /** 체크박스 옆 문구 */
  label: string;
  required: true;
  /** "보기" 링크 */
  linkHref?: string;
  linkLabel?: string;
}

export const REQUIRED_CONSENTS: readonly ConsentItem[] = [
  { id: "age14", label: "만 14세 이상입니다", required: true },
  { id: "terms", label: "이용약관에 동의합니다", required: true, linkHref: "/terms", linkLabel: "보기" },
] as const;

export const PRIVACY_NOTICE: { text: string; linkHref: "/privacy"; linkLabel: string } = {
  text: "서비스 이용에 필요한 개인정보는 개인정보 처리방침에 따라 처리됩니다.",
  linkHref: "/privacy",
  linkLabel: "개인정보 처리방침",
};

/** 필수 항목이 모두 true일 때만 true. 누락·false는 거부한다 */
export function allRequiredAgreed(state: Partial<Record<RequiredConsentId, boolean>>): boolean {
  return REQUIRED_CONSENTS.every((item) => state[item.id] === true);
}
