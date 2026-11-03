// 웹 푸시 서비스 워커 (docs/features/푸시알림.md 5장)
// FCM 데이터 메시지를 받아 직접 표시한다. Firebase SDK는 불러오지 않는다.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// "/chat/x" 같은 앱 내부 경로만 연다
function safeLink(link) {
  if (typeof link !== "string" || !link.startsWith("/") || link.startsWith("//") || link.includes("\\")) {
    return "/notifications";
  }
  return link;
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
  const url = new URL(safeLink(event.notification.data && event.notification.data.link), self.location.origin).href;

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
