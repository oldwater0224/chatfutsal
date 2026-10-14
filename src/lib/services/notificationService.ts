import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { NotificationType } from "../../types";

// 트랜잭션 등에서 직접 set할 때도 같은 필드 구성을 쓰도록 분리
export function buildNotification(
  recipientId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string,
) {
  return {
    recipientId,
    type,
    title,
    body,
    link,
    isRead: false,
    createdAt: serverTimestamp(),
  };
}

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string,
): Promise<string> {
  const docRef = await addDoc(
    collection(db, "notifications"),
    buildNotification(recipientId, type, title, body, link),
  );
  return docRef.id;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const q = query(
    collection(db, "notifications"),
    where("recipientId", "==", userId),
    where("isRead", "==", false),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const BATCH_LIMIT = 500;
  for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    snapshot.docs
      .slice(i, i + BATCH_LIMIT)
      .forEach((d) => batch.update(doc(db, "notifications", d.id), { isRead: true }));
    await batch.commit();
  }
}
