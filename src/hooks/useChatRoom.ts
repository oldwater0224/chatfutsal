"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { isHiddenForUser, parseLeftAt } from "@/src/lib/services/chatService";
import { ChatRoom } from "@/src/types";

interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
}

export function useChatRooms(userId: string | undefined) {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithUnread[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);

  const handleError = useCallback((error: Error) => {
    console.error("채팅방 불러오기 에러:", error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const chatRoomsRef = collection(db, "chatRooms");
    const q = query(
      chatRoomsRef,
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc"),
    );

    const messageUnsubscribes: (() => void)[] = [];

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        messageUnsubscribes.forEach((unsub) => unsub());
        messageUnsubscribes.length = 0;

        const rooms: ChatRoomWithUnread[] = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              participants: data.participants,
              participantNames: data.participantNames,
              participantName: "",
              lastMessage: data.lastMessage || "",
              lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
              createdAt: data.createdAt?.toDate() || new Date(),
              leftAt: parseLeftAt(data.leftAt),
              unreadCount: 0,
            };
          })
          // 내가 나간 뒤 새 메시지가 없는 방은 목록에서 숨김
          .filter(
            (room) => !isHiddenForUser(room.leftAt, room.lastMessageAt, userId),
          );

        setChatRooms(rooms);
        setIsLoading(false);

        rooms.forEach((room) => {
          const messagesRef = collection(db, "chatRooms", room.id, "messages");
          const messagesQuery = query(messagesRef);
          const myLeftAt = room.leftAt?.[userId];

          const msgUnsubscribe = onSnapshot(messagesQuery, (msgSnapshot) => {
            const unreadCount = msgSnapshot.docs.filter((msgDoc) => {
              const msgData = msgDoc.data();
              const readBy = msgData.readBy || [];
              // 나가기 전 메시지는 안 읽음 수에서 제외
              if (myLeftAt) {
                const createdAt: Date = msgData.createdAt?.toDate() || new Date();
                if (createdAt.getTime() <= myLeftAt.getTime()) return false;
              }
              return msgData.senderId !== userId && !readBy.includes(userId);
            }).length;

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
      handleError,
    );

    return () => {
      unsubscribe();
      messageUnsubscribes.forEach((unsub) => unsub());
    };
  }, [userId, handleError]);

  const totalUnread = chatRooms.reduce(
    (sum, room) => sum + room.unreadCount,
    0,
  );
  return { chatRooms, isLoading, totalUnread };
}
