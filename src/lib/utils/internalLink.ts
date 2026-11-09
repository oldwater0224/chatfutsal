// 알림 link 같은 사용자 입력 경로가 앱 안쪽을 가리키는지 판정한다 (순수 함수)
// docs/features/푸시알림.md 4-3장. public/firebase-messaging-sw.js의 safeLink가 같은 규칙을 따른다.

// 판정용 가상 출처. 실제 요청은 보내지 않는다
const BASE_ORIGIN = "https://internal.invalid";

// URL 파서가 지우거나 바꾸는 문자: 제어 문자(탭·줄바꿈 포함), DEL, 역슬래시, 공백류
// 예: new URL("/\t/evil.com", origin)은 탭을 지워 "//evil.com"이 되고 다른 출처로 해석된다
const UNSAFE_CHARS = /[\u0000-\u001F\u007F\\\s]/;

// "/chat/x" 같은 앱 내부 경로만 true
export function isInternalPath(link: unknown): link is string {
  if (typeof link !== "string") return false;
  if (!link.startsWith("/") || link.startsWith("//")) return false;
  if (UNSAFE_CHARS.test(link)) return false;
  // 위 검사가 놓친 경우까지 막기 위해 실제로 해석해 출처가 그대로인지 확인한다
  // "/.//evil.com"·"/..//evil.com"은 출처는 그대로지만 경로가 "//evil.com"으로 정규화되어
  // router.push 등에서 프로토콜 상대 주소가 될 수 있으므로 함께 막는다
  try {
    const url = new URL(link, BASE_ORIGIN);
    return url.origin === BASE_ORIGIN && !url.pathname.startsWith("//");
  } catch {
    return false;
  }
}

// 로그인·가입 흐름으로 되돌아가는 경로. 로그인 후 여기로 보내면 다시 로그인 화면을 만나거나 루프가 생긴다
const AUTH_PATH_PREFIXES = ["/login", "/signup", "/auth"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// 로그인 후 이동할 ?next= 값을 안전한 내부 경로로 바꾼다. 쓸 수 없으면 "/"
export function resolveNextPath(next: string | null | undefined): string {
  if (!isInternalPath(next)) return "/";
  // isInternalPath를 통과했으므로 같은 출처로 해석된다. 정규화된 pathname으로 판정해 "/./login" 같은 우회도 막는다
  const { pathname } = new URL(next, BASE_ORIGIN);
  return isAuthPath(pathname) ? "/" : next;
}
