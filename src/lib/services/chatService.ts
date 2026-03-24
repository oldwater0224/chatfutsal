import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

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
    await deleteDoc(doc(db, "chatRooms", roomId));

    console.log("채팅방 삭제 완료", roomId);
  } catch (e) {
    console.error("채팅방 삭제 실패", e);
    throw e;
  }
}
// 메세지 읽음 처리
export async function markMessagesAsRead(
  roomId: string,
  userId: string,
): Promise<void> {
  try {
    console.log('읽음 처리 시작:');
    console.log('roomId:' , roomId);
    console.log('userId:' , userId);

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    console.log('messagesRef 경로:' , messagesRef)
    const q = query(messagesRef);
    const snapshot = await getDocs(q);

    console.log('조회된 메세지 수:' , snapshot.docs.length);

    if (snapshot.docs.length === 0) {
      console.log('메시지가 없습니다! 경로를 확인하세요.');
      return;
    }

    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach((msgDoc) => {
      const data = msgDoc.data();
      const readBy: string[] = data.readBy || [];

       // ✅ 각 메시지 상태 로그
      console.log('--- 메시지 ---');
      console.log('id:', msgDoc.id);
      console.log('senderId:', data.senderId);
      console.log('현재 userId:', userId);
      console.log('내가 보낸 메시지?:', data.senderId === userId);
      console.log('readBy:', readBy);
      console.log('이미 읽음?:', readBy.includes(userId));

      // 아직 읽지 않은 메세지만 업데이트
      if (data.senderId !== userId && !readBy.includes(userId)) {
        batch.update(doc(db, "chatRooms", roomId, "messages", msgDoc.id), {
          readBy: [...readBy, userId],

        })
        console.log('→ 업데이트 대상!');
        updateCount++;
      }else {
        console.log('스킵 (내 메세지이거나 이미 읽음)');
      }
    });
      console.log('총 업데이트할 메시지 수:', updateCount);


    if(updateCount > 0){
      await batch.commit();
       console.log('batch.commit() 완료');

    }else {
      console.log('읽을 메세지 없음');
    }

  } catch (error) {
    console.error("메세지 읽음 처리 실패:", error);
  }
}

// 읽지 않은 메시지 수 계산
export function getUnreadCount(
  messages: { readBy?: string[] }[],
  userId: string
): number {
  return messages.filter(
    (msg) => !msg.readBy || !msg.readBy.includes(userId)
  ).length;
}
