"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { ChatRoom } from "@/src/types";

interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
}

export function useChatRooms(userId: string | undefined) {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithUnread[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId); //  userId 있으면 true

  useEffect(() => {
    if (!userId) {
      return;
    }

    const chatRoomsRef = collection(db, "chatRooms");
    const q = query(
      chatRoomsRef,
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc"),
    );

    // 메시지 구독 해제 함수들 저장
    const messageUnsubscribes: (() => void)[] = [];

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // 이전 메시지 구독 해제
        messageUnsubscribes.forEach((unsubscribe) => unsubscribe());
        messageUnsubscribes.length = 0;

        const rooms: ChatRoomWithUnread[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            participants: data.participants,
            participantNames: data.participantNames,
            participantName: "",
            lastMessage: data.lastMessage || "",
            lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            unreadCount: 0,
          };
        });

        // 초기 상태 설정
        setChatRooms(rooms);
        setIsLoading(false);

        // 각 채팅방의 메시지 실시간 구독
        rooms.forEach((room) => {
          const messagesRef = collection(db, "chatRooms", room.id, "messages");
          const messagesQuery = query(messagesRef);

          const msgUnsubscribe = onSnapshot(messagesQuery, (msgSnapshot) => {
            // 읽지 않은 메시지 수 계산
            const unreadCount = msgSnapshot.docs.filter((msgDoc) => {
              const msgData = msgDoc.data();
              const readBy = msgData.readBy || [];
              return msgData.senderId !== userId && !readBy.includes(userId);
            }).length;

            // 해당 채팅방의 unreadCount 업데이트
            setChatRooms((prevRooms) => {
              const newRooms = [...prevRooms];
              const roomIndex = newRooms.findIndex((r) => r.id === room.id);
              if (roomIndex !== -1) {
                newRooms[roomIndex] = { ...newRooms[roomIndex], unreadCount };
              }
              return newRooms;
            });
          });

          messageUnsubscribes.push(msgUnsubscribe);
        });
      },
      (error) => {
        console.error("채팅방 불러오기 에러:", error);
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
      messageUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [userId]);

  // ✅ totalUnread 계산 
  const totalUnread = chatRooms.reduce(
    (sum, room) => sum + room.unreadCount,
    0,
  );
  return { chatRooms, isLoading, totalUnread };
}
