// isInternalPath와 서비스 워커 safeLink가 함께 검사하는 입력 목록
// internalLink.test.ts(서버 판정)와 internalLink.sw-parity.test.ts(서비스 워커와의 판정 일치)가 같은 목록을 쓴다

// 앱 내부 경로 (허용)
export const ALLOWED_PATHS: readonly string[] = [
  '/chat/r1',
  '/notifications',
  '/recruit/abc?tab=1#top',
  '/',
  '/chat/r1?x=1#y',
];

// 다른 출처로 해석되거나 상대 경로인 값
export const CROSS_ORIGIN_INPUTS: readonly string[] = [
  'https://evil.com',
  '//evil.com',
  '/\\evil.com',
  'javascript:alert(1)',
  'chat/r1',
  '',
];

// URL 파서가 지우는 제어 문자로 "//evil.com"을 만드는 값
export const CONTROL_CHAR_INPUTS: readonly string[] = [
  '/\t/evil.com',
  '/\n/evil.com',
  '/\r/evil.com',
  '/\u0000/evil.com',
  '/\u007F/evil.com',
];

// 정규화 후 경로가 "//"로 시작하는 값
export const NORMALIZATION_INPUTS: readonly string[] = [
  '/.//evil.com',
  '/..//evil.com',
];

// 앞뒤 공백이 있는 값
export const WHITESPACE_INPUTS: readonly string[] = [
  ' /x',
  '/x ',
  ' //evil.com',
];

// 문자열이 아닌 값
export const NON_STRING_INPUTS: readonly unknown[] = [
  undefined,
  null,
  123,
  { toString: () => '/chat/r1' },
];

// 막아야 하는 값 전체
export const BLOCKED_INPUTS: readonly unknown[] = [
  ...CROSS_ORIGIN_INPUTS,
  ...CONTROL_CHAR_INPUTS,
  ...NORMALIZATION_INPUTS,
  ...WHITESPACE_INPUTS,
  ...NON_STRING_INPUTS,
];

// 허용·차단 입력 전체 (25개)
export const ALL_LINK_INPUTS: readonly unknown[] = [...ALLOWED_PATHS, ...BLOCKED_INPUTS];
