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

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, "notifications"), {
    recipientId,
    type,
    title,
    body,
    link,
    isRead: false,
    createdAt: serverTimestamp(),
  });
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

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(doc(db, "notifications", d.id), { isRead: true });
  });
  await batch.commit();
}
