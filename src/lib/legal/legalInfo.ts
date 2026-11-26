// 개인정보 처리방침·이용약관에 들어가는 운영 정보 (Firebase 의존성 없는 순수 모듈)
// 아직 정해지지 않은 값은 null로 두고, 화면에서는 legalValue()로 LEGAL_PLACEHOLDER를 표시한다.
// 릴리스 전에 missingLegalInfo()로 빈 항목이 없는지 점검한다.

export const LEGAL_PLACEHOLDER = "(추후 기재)";

export interface LegalInfo {
  serviceName: string;
  operatorName: string;
  privacyOfficer: string;
  /** 이용자 문의·개인정보 열람 요청을 받을 이메일 주소 */
  contactEmail: string | null;
  firestoreRegion: string | null;
  vercelRegion: string | null;
  /** 국외 이전받는 자(Google LLC)의 개인정보 문의처. URL (개인정보 보호법 제28조의8 제2항) */
  googlePrivacyContact: string | null;
  /** 국외 이전받는 자(Vercel Inc.)의 개인정보 문의처. URL (개인정보 보호법 제28조의8 제2항) */
  vercelPrivacyContact: string | null;
  /** 개인정보 처리방침 시행일 "YYYY-MM-DD" */
  privacyEffectiveDate: string | null;
  /** 이용약관 시행일 "YYYY-MM-DD" */
  termsEffectiveDate: string | null;
}

export const LEGAL_INFO: Readonly<LegalInfo> = {
  serviceName: "ChatFutsal",
  operatorName: "정헌수",
  privacyOfficer: "정헌수",
  contactEmail: "oldwater0224@gmail.com",
  // 처리방침 화면에 그대로 나오므로 리전 코드가 아니라 사람이 읽는 서술형으로 적는다
  // Firebase Authentication·FCM과 Vercel 엣지 네트워크는 리전 설정과 별개로 해외에서 처리될 수 있어 함께 적는다
  // 근거: Firestore 위치 asia-northeast3, 2026-11-26 Firebase 콘솔 확인
  firestoreRegion: "대한민국(서울): 데이터베이스 / 미국 등: 로그인 인증·푸시 발송",
  // 근거: Vercel Function Region icn1(ap-northeast-2), 2026-11-26 Vercel 대시보드 확인
  vercelRegion: "대한민국(서울): 서버 함수 / 전 세계 엣지 네트워크: 웹 요청 전달",
  // 확실한 담당 연락처를 확인하지 못해 정책 페이지(안의 문의처)를 기재한다
  googlePrivacyContact: "https://policies.google.com/privacy",
  vercelPrivacyContact: "https://vercel.com/legal/privacy-policy",
  // consents.ts의 PRIVACY_VERSION과 같은 날짜로 맞춘다
  privacyEffectiveDate: "2026-11-18",
  // consents.ts의 TERMS_VERSION과 같은 날짜로 맞춘다
  termsEffectiveDate: "2026-11-18",
};

export type LegalInfoKey = keyof LegalInfo;

/** null이면 LEGAL_PLACEHOLDER를 돌려준다 */
export function legalValue(value: string | null | undefined): string {
  if (value == null) return LEGAL_PLACEHOLDER;
  const trimmed = value.trim();
  return trimmed === "" ? LEGAL_PLACEHOLDER : trimmed;
}

/**
 * 실제 이름 대신 쓰이는 일반 명칭. operatorName·privacyOfficer가 이 값이면 미정으로 본다.
 * 비교는 앞뒤 공백을 지우고 영문 대소문자를 무시한다.
 */
export const GENERIC_PERSON_NAMES: readonly string[] = [
  "운영자",
  "관리자",
  "담당자",
  "운영팀",
  "개인정보 보호책임자",
  "admin",
  "operator",
  "tbd",
  LEGAL_PLACEHOLDER,
];

/** 이름 필드: 일반 명칭이면 미정으로 본다 */
const PERSON_NAME_KEYS: readonly LegalInfoKey[] = ["operatorName", "privacyOfficer"];

function isGenericPersonName(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return GENERIC_PERSON_NAMES.some((name) => name.toLowerCase() === normalized);
}

/**
 * 미정 항목 이름 목록. 릴리스 전 점검용. 인자를 생략하면 LEGAL_INFO를 검사한다.
 * - 모든 항목: null·빈 문자열·공백
 * - operatorName·privacyOfficer: "운영자" 같은 일반 명칭(GENERIC_PERSON_NAMES)
 */
export function missingLegalInfo(info: Readonly<LegalInfo> = LEGAL_INFO): LegalInfoKey[] {
  return (Object.keys(info) as LegalInfoKey[]).filter((key) => {
    const value = info[key];
    if (value == null || value.trim() === "") return true;
    return PERSON_NAME_KEYS.includes(key) && isGenericPersonName(value);
  });
}
