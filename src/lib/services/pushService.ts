// 웹 푸시 토큰 관리와 발송 요청 (docs/features/푸시알림.md)
import { getApp } from "firebase/app";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { auth, db } from "../firebase";
import { PUSH_MAX_IDS } from "../server/pushRules";

const SW_PATH = "/firebase-messaging-sw.js";
// 로그아웃 때 이 기기 토큰 문서를 지우려고 기억해 둔다
const TOKEN_STORAGE_KEY = "chatfutsal:fcmToken";
// 처음 등록한 서비스 워커가 활성화되기를 기다리는 최대 시간
export const SW_ACTIVATION_TIMEOUT_MS = 10_000;
// 로그아웃이 토큰 정리를 기다리는 최대 시간 (오프라인이면 Firestore 삭제가 끝나지 않는다)
export const UNREGISTER_TIMEOUT_MS = 3_000;

function rememberToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // 저장소를 못 써도 푸시는 동작한다
  }
}

function rememberedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

// 등록 객체에 활성 서비스 워커가 생길 때까지 기다린다.
// getToken에 등록 객체를 넘기면 활성화를 기다리지 않고 pushManager.subscribe를 불러,
// 처음 등록 직후에는 "no active Service Worker"로 실패한다.
// navigator.serviceWorker.ready는 다른 등록 객체로 풀릴 수 있고 제한 시간이 없어 쓰지 않는다.
export function waitForActiveWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs: number = SW_ACTIVATION_TIMEOUT_MS,
): Promise<ServiceWorkerRegistration> {
  if (registration.active) return Promise.resolve(registration);

  const worker = registration.installing ?? registration.waiting;
  if (!worker) return Promise.reject(new Error("서비스 워커가 설치 중이 아니어서 활성화를 기다릴 수 없습니다"));

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", onStateChange);
    };
    const onStateChange = () => {
      if (worker.state === "activated" || registration.active) {
        cleanup();
        resolve(registration);
      } else if (worker.state === "redundant") {
        cleanup();
        reject(new Error("서비스 워커 설치에 실패했습니다 (redundant)"));
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`서비스 워커가 ${timeoutMs}ms 안에 활성화되지 않았습니다`));
    }, timeoutMs);
    worker.addEventListener("statechange", onStateChange);
    // 리스너를 붙이기 전에 상태가 바뀌었을 수 있다
    onStateChange();
  });
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return false;
  return isSupported().catch(() => false);
}

// 알림 권한이 허용된 상태에서 호출한다. 토큰을 받아 fcmTokens/{토큰}에 저장한다.
// 토큰(기기)당 문서가 하나라서, 같은 브라우저에서 다른 계정으로 로그인하면 소유자가 새 계정으로 바뀐다.
export async function registerPushToken(uid: string): Promise<string> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error("NEXT_PUBLIC_FIREBASE_VAPID_KEY가 없습니다");

  const registration = await waitForActiveWorker(await navigator.serviceWorker.register(SW_PATH));
  const token = await getToken(getMessaging(getApp()), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  await setDoc(doc(db, "fcmTokens", token), { uid, updatedAt: serverTimestamp() });
  rememberToken(token);
  return token;
}

// 이 기기의 FCM 토큰을 폐기한다.
// deleteToken은 getToken으로 서비스 워커를 지정한 적이 없으면(새로고침 후 등) 기본 서비스 워커를
// 따로 등록하므로, 우리 서비스 워커로 getToken을 먼저 불러 지정해 둔다.
async function deleteDeviceToken(): Promise<void> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || Notification.permission !== "granted" || !(await isPushSupported())) return;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) return;

  const messaging = getMessaging(getApp());
  await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  await deleteToken(messaging);
}

// 로그아웃 전에 호출한다. 실패해도 로그아웃은 계속한다. 절대 reject하지 않는다.
// 토큰 문서 삭제가 실패해도 다음에 이 기기로 로그인한 계정이 토큰 문서를 덮어써 소유자가 바뀐다.
// 오프라인이면 deleteDoc이 끝나지 않으므로 최대 UNREGISTER_TIMEOUT_MS만 기다린다.
// 삭제는 취소하지 않고 백그라운드에서 계속한다 (다시 연결되면 Firestore가 마저 보낸다).
export async function unregisterPushToken(): Promise<void> {
  const token = rememberedToken();
  if (!token) return;
  rememberToken(null);

  const deletes = Promise.allSettled([
    Promise.resolve().then(() => deleteDoc(doc(db, "fcmTokens", token))),
    deleteDeviceToken(),
  ]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, UNREGISTER_TIMEOUT_MS);
  });
  try {
    await Promise.race([deletes, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

// 알림 문서를 커밋한 뒤 호출한다. 응답을 기다리지 않고, 실패해도 무시한다 (인앱 알림은 이미 저장됨).
export function requestPush(notificationIds: string[]): void {
  const user = auth.currentUser;
  if (!user || notificationIds.length === 0) return;

  user
    .getIdToken()
    .then((idToken) => {
      // 서버가 한 번에 받는 최대 개수로 나눠 보낸다
      const requests = [];
      for (let i = 0; i < notificationIds.length; i += PUSH_MAX_IDS) {
        requests.push(
          fetch("/api/push", {
            method: "POST",
            headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ notificationIds: notificationIds.slice(i, i + PUSH_MAX_IDS) }),
            // 발송 직후 페이지를 떠나도 요청이 끝나게 한다
            keepalive: true,
          }),
        );
      }
      return Promise.all(requests);
    })
    .catch((error) => console.error("푸시 요청 실패:", error));
}
