// 웹 푸시 토큰 관리와 발송 요청 (docs/features/푸시알림.md)
import { getApp } from "firebase/app";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { auth, db } from "../firebase";

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

// 알림 권한이 허용된 상태에서 호출한다. 토큰을 받아 users/{uid}/fcmTokens에 저장한다.
export async function registerPushToken(uid: string): Promise<string> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error("NEXT_PUBLIC_FIREBASE_VAPID_KEY가 없습니다");

  const registration = await navigator.serviceWorker.register(SW_PATH);
  const token = await getToken(getMessaging(getApp()), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  await setDoc(doc(db, "users", uid, "fcmTokens", token), { token, updatedAt: serverTimestamp() });
  rememberToken(token);
  return token;
}

// 로그아웃 전에 호출한다. 실패해도 로그아웃은 계속한다.
export async function unregisterPushToken(uid: string): Promise<void> {
  const token = rememberedToken();
  if (!token) return;
  rememberToken(null);
  await Promise.allSettled([
    deleteDoc(doc(db, "users", uid, "fcmTokens", token)),
    isPushSupported().then((ok) => (ok ? deleteToken(getMessaging(getApp())) : false)),
  ]);
}

// 알림 문서를 커밋한 뒤 호출한다. 응답을 기다리지 않고, 실패해도 무시한다 (인앱 알림은 이미 저장됨).
export function requestPush(notificationIds: string[]): void {
  const user = auth.currentUser;
  if (!user || notificationIds.length === 0) return;

  user
    .getIdToken()
    .then((idToken) => {
      // 서버가 한 번에 받는 최대 개수(50)로 나눠 보낸다
      const requests = [];
      for (let i = 0; i < notificationIds.length; i += 50) {
        requests.push(
          fetch("/api/push", {
            method: "POST",
            headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ notificationIds: notificationIds.slice(i, i + 50) }),
            // 발송 직후 페이지를 떠나도 요청이 끝나게 한다
            keepalive: true,
          }),
        );
      }
      return Promise.all(requests);
    })
    .catch((error) => console.error("푸시 요청 실패:", error));
}
