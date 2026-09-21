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

        setChatRooms(rooms);
        setIsLoading(false);

        rooms.forEach((room) => {
          const messagesRef = collection(db, "chatRooms", room.id, "messages");
          const messagesQuery = query(messagesRef);

          const msgUnsubscribe = onSnapshot(messagesQuery, (msgSnapshot) => {
            const unreadCount = msgSnapshot.docs.filter((msgDoc) => {
              const msgData = msgDoc.data();
              const readBy = msgData.readBy || [];
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
