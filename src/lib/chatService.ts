import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

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

// 채팅방 나가기
export async function leaveChatRoom(roomId: string): Promise<void> {
  try {
    // 메세지 서브컬렉션 삭제
    const messageRef = collection(db, "chatRooms", roomId, "message");
    const messageSnapshot = await getDocs(messageRef);

    const deletePromises = messageSnapshot.docs.map((msgDoc) =>
      deleteDoc(doc(db, "chatRooms", roomId, "message", msgDoc.id)),
    );
    await Promise.all(deletePromises);

    // 채팅방 삭제
    await deleteDoc(doc(db , 'chatRooms' , roomId));

    console.log('채팅방 삭제 완료' , roomId);
  } catch(e) {
    console.error('채팅방 삭제 실패' ,e);
    throw e
  }
}
