// 웹 푸시 토큰 관리와 발송 요청 (docs/features/푸시알림.md)
import { getApp } from "firebase/app";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { auth, db } from "../firebase";
import { PUSH_MAX_IDS } from "../server/pushRules";

const SW_PATH = "/firebase-messaging-sw.js";
// 로그아웃 때 이 기기 토큰 문서를 지우려고 기억해 둔다
const TOKEN_STORAGE_KEY = "chatfutsal:fcmToken";

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

  const registration = await navigator.serviceWorker.register(SW_PATH);
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

// 로그아웃 전에 호출한다. 실패해도 로그아웃은 계속한다.
// 토큰 문서 삭제가 실패해도 다음에 이 기기로 로그인한 계정이 토큰 문서를 덮어써 소유자가 바뀐다.
export async function unregisterPushToken(): Promise<void> {
  const token = rememberedToken();
  if (!token) return;
  rememberToken(null);
  await Promise.allSettled([deleteDoc(doc(db, "fcmTokens", token)), deleteDeviceToken()]);
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
