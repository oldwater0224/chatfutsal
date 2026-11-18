// 개인정보 처리방침·이용약관에 들어가는 운영 정보 (Firebase 의존성 없는 순수 모듈)
// 아직 정해지지 않은 값은 null로 두고, 화면에서는 legalValue()로 LEGAL_PLACEHOLDER를 표시한다.
// 릴리스 전에 missingLegalInfo()로 빈 항목이 없는지 점검한다.

export const LEGAL_PLACEHOLDER = "(추후 기재)";

export const LEGAL_INFO = {
  serviceName: "ChatFutsal",
  operatorName: "운영자",
  privacyOfficer: "운영자",
  // TODO: 이용자 문의·개인정보 열람 요청을 받을 이메일 주소 (운영자가 정해서 기재)
  contactEmail: null as string | null,
  // TODO: Firebase 콘솔 > 프로젝트 설정 > 일반 > "기본 GCP 리소스 위치" 또는 Firestore Database 화면의 위치 (예: asia-northeast3)
  firestoreRegion: null as string | null,
  // TODO: Vercel 프로젝트 Settings > Functions > Function Region (또는 vercel.json의 regions) (예: icn1)
  vercelRegion: null as string | null,
  // TODO: 국외 이전받는 자(Google LLC)의 개인정보 문의 연락처 (개인정보 보호법 제28조의8 제2항)
  googlePrivacyContact: null as string | null,
  // TODO: 국외 이전받는 자(Vercel Inc.)의 개인정보 문의 연락처 (개인정보 보호법 제28조의8 제2항)
  vercelPrivacyContact: null as string | null,
  // TODO: 개인정보 처리방침 시행일 "YYYY-MM-DD" (배포일에 맞춰 기재)
  privacyEffectiveDate: null as string | null,
  // TODO: 이용약관 시행일 "YYYY-MM-DD" (배포일에 맞춰 기재)
  termsEffectiveDate: null as string | null,
} as const;

export type LegalInfoKey = keyof typeof LEGAL_INFO;

/** null이면 LEGAL_PLACEHOLDER를 돌려준다 */
export function legalValue(value: string | null | undefined): string {
  if (value == null) return LEGAL_PLACEHOLDER;
  const trimmed = value.trim();
  return trimmed === "" ? LEGAL_PLACEHOLDER : trimmed;
}

/** 미정 항목 이름 목록. 릴리스 전 점검용 */
export function missingLegalInfo(): string[] {
  return (Object.keys(LEGAL_INFO) as LegalInfoKey[]).filter((key) => {
    const value = LEGAL_INFO[key];
    return value == null || value.trim() === "";
  });
}
