import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

// Firestore의 leftAt 맵({ uid: Timestamp })을 { uid: Date }로 변환
export function parseLeftAt(
  raw: Record<string, { toDate?: () => Date } | null> | undefined,
): Record<string, Date> {
  const result: Record<string, Date> = {};
  if (!raw) return result;
  Object.entries(raw).forEach(([uid, value]) => {
    // serverTimestamp 반영 전(null)에는 방금 나간 것으로 간주
    result[uid] = value?.toDate ? value.toDate() : new Date();
  });
  return result;
}

// 해당 유저 기준으로 채팅방이 숨김 상태인지 (나간 뒤 새 메시지가 없음)
export function isHiddenForUser(
  leftAt: Record<string, Date> | undefined,
  lastMessageAt: Date,
  userId: string,
): boolean {
  const myLeftAt = leftAt?.[userId];
  return !!myLeftAt && lastMessageAt.getTime() <= myLeftAt.getTime();
}

// 기존 채팅방 찾기
export async function findExistingChatRoom(
  userId1: string,
  userId2: string,
): Promise<string | null> {
  const participants = [userId1, userId2].sort();

  const chatRoomsRef = collection(db, "chatRooms");
  const q = query(chatRoomsRef, where("participants", "==", participants));

  try {
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
  } catch (error) {
    console.error("채팅방 검색 에러:", error);
  }

  return null;
}

// 새 채팅방 생성
export async function createChatRoom(
  user1: { uid: string; displayName: string },
  user2: { uid: string; displayName: string },
): Promise<string> {
  const participants = [user1.uid, user2.uid].sort();

  const chatRoomData = {
    participants,
    participantNames: {
      [user1.uid]: user1.displayName,
      [user2.uid]: user2.displayName,
    },
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "chatRooms"), chatRoomData);
  return docRef.id;
}

// 채팅 시작 (기존 방 있으면 반환, 없으면 생성)
export async function startChat(
  currentUser: { uid: string; displayName: string },
  targetUser: { uid: string; displayName: string },
): Promise<string> {
  // 기존 채팅방 확인
  const existingRoomId = await findExistingChatRoom(
    currentUser.uid,
    targetUser.uid,
  );

  if (existingRoomId) {
    return existingRoomId;
  }

  // 새 채팅방 생성
  const newRoomId = await createChatRoom(currentUser, targetUser);
  return newRoomId;
}

// 채팅방 완전 삭제 (메시지 서브컬렉션 + 채팅방 문서)
async function deleteChatRoomCompletely(roomId: string): Promise<void> {
  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  const messageSnapshot = await getDocs(messagesRef);

  // writeBatch는 한 번에 최대 500개 작업까지 가능하므로 나눠서 커밋
  const BATCH_LIMIT = 500;
  for (let i = 0; i < messageSnapshot.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    messageSnapshot.docs
      .slice(i, i + BATCH_LIMIT)
      .forEach((msgDoc) => batch.delete(msgDoc.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, "chatRooms", roomId));
}

// 채팅방 나가기
// - 나간 유저의 목록에서만 숨긴다 (leftAt에 나간 시각 기록)
// - 상대가 새 메시지를 보내면 다시 목록에 나타나며, 나간 이후 메시지만 보인다
// - 모든 참여자가 나간 상태가 되면 채팅방과 메시지를 완전히 삭제한다
export async function leaveChatRoom(
  roomId: string,
  userId: string,
): Promise<void> {
  try {
    const roomRef = doc(db, "chatRooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    const data = roomSnap.data();
    const participants: string[] = data.participants || [];
    const leftAt = parseLeftAt(data.leftAt);
    const lastMessageAt: Date = data.lastMessageAt?.toDate?.() || new Date(0);

    const othersAllLeft = participants
      .filter((id) => id !== userId)
      .every((id) => isHiddenForUser(leftAt, lastMessageAt, id));

    if (othersAllLeft) {
      await deleteChatRoomCompletely(roomId);
      return;
    }

    await updateDoc(roomRef, {
      [`leftAt.${userId}`]: serverTimestamp(),
    });
  } catch (e) {
    console.error("채팅방 나가기 실패", e);
    throw e;
  }
}
// 메세지 읽음 처리
export async function markMessagesAsRead(
  roomId: string,
  userId: string,
): Promise<void> {
  try {
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef);
    const snapshot = await getDocs(q);

    if (snapshot.docs.length === 0) return;

    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach((msgDoc) => {
      const data = msgDoc.data();
      const readBy: string[] = data.readBy || [];

      if (data.senderId !== userId && !readBy.includes(userId)) {
        batch.update(doc(db, "chatRooms", roomId, "messages", msgDoc.id), {
          readBy: [...readBy, userId],
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("메세지 읽음 처리 실패:", error);
  }
}
