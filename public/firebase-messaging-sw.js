// 웹 푸시 서비스 워커 (docs/features/푸시알림.md 5장)
// FCM 데이터 메시지를 받아 직접 표시한다. Firebase SDK는 불러오지 않는다.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const FALLBACK_LINK = "/notifications";

// "/chat/x" 같은 앱 내부 경로만 연다
// 서비스 워커는 TS를 불러올 수 없어 src/lib/utils/internalLink.ts의 isInternalPath와 같은 규칙을 옮겨 둔다.
// 제어 문자(탭·줄바꿈)는 URL 파서가 지워 "/\t/evil.com"이 "//evil.com"이 되므로 함께 막는다
function safeLink(link) {
  if (
    typeof link !== "string" ||
    !link.startsWith("/") ||
    link.startsWith("//") ||
    /[\u0000-\u001F\u007F\\\s]/.test(link)
  ) {
    return FALLBACK_LINK;
  }
  // 해석 후 출처가 그대로이고 경로가 "//"로 시작하지 않아야 한다 ("/.//evil.com" → "//evil.com")
  try {
    const url = new URL(link, self.location.origin);
    if (url.origin !== self.location.origin || url.pathname.startsWith("//")) return FALLBACK_LINK;
  } catch {
    return FALLBACK_LINK;
  }
  return link;
}

// 연 주소가 이 앱 출처인지 한 번 더 확인한다 (safeLink가 놓친 경우 대비)
function resolveLink(link) {
  try {
    const url = new URL(safeLink(link), self.location.origin);
    if (url.origin === self.location.origin) return url.href;
  } catch {
    // 아래 기본 경로로
  }
  return new URL(FALLBACK_LINK, self.location.origin).href;
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    return;
  }
  const data = payload.data || {};
  if (!data.title) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // 푸시를 받으면 항상 알림을 띄운다. Safari·iOS는 알림 없이 끝난 푸시가 반복되면 구독을 취소한다.
      // 앱을 보고 있으면 인앱 배지가 이미 갱신되므로 소리·진동 없이 띄운다.
      const appVisible = clients.some((client) => client.visibilityState === "visible");

      return self.registration.showNotification(data.title, {
        body: data.body || "",
        icon: "/icon.svg",
        tag: data.notificationId || undefined,
        silent: appVisible,
        data: { link: safeLink(data.link) },
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = resolveLink(event.notification.data && event.notification.data.link);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => new URL(c.url).origin === self.location.origin);
      // navigate는 이 서비스 워커가 제어하는 탭에서만 된다. 안 되면 새 창으로 연다
      if (client) {
        return client
          .focus()
          .then((c) => c.navigate(url))
          .catch(() => self.clients.openWindow(url));
      }
      return self.clients.openWindow(url);
    }),
  );
});
