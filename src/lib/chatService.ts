// 두 유저 간 기존 채팅방 찾기
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export async function findExistingChatRoom(
  userId1: string,
  userId2: string,
): Promise<string | null> {
  const chatRoomRef = collection(db, "chatRooms");

  // participants 배열을 정렬해서 검색
  const sortedParticipants = [userId1, userId2].sort();

  const q = query(chatRoomRef, where("participants", "==", sortedParticipants));

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  return null;
}

// 새로운 채팅방 생성

export async function createChatRoom(
  user1: { uid: string; displayName: string },
  user2: { uid: string; displayName: string },
): Promise<string> {
  const sortedParticipants = [user1.uid, user2.uid].sort();

  const chatRoomData = {
    participants: sortedParticipants,
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

// 유저 정보 가져오기
export async function getUserInfo(
  userId: string,
): Promise<{ uid: string; displayName: string } | null> {
  const userDoc = await getDoc(doc(db, "users", userId));

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      uid: userId,
      displayName: data.displayName || "사용자",
    };
  }

  return null;
}
