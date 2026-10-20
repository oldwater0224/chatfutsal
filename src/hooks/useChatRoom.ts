"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import {
  isHiddenForUser,
  parseLeftAt,
  UNREAD_SCAN_LIMIT,
} from "@/src/lib/services/chatService";
import { countUnread, sumUnread } from "@/src/lib/utils/chatUnread";
import { ChatRoom } from "@/src/types";

interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
}

// 스냅샷 결과를 소유 userId와 함께 보관해, 유저가 바뀌는 순간 이전 데이터가 노출되지 않게 한다
interface ChatRoomsState {
  ownerId: string | undefined;
  rooms: ChatRoomWithUnread[];
  isLoading: boolean;
}

export function useChatRooms(userId: string | undefined) {
  const [state, setState] = useState<ChatRoomsState>({
    ownerId: userId,
    rooms: [],
    isLoading: !!userId,
  });

  const handleError = useCallback((ownerId: string, error: Error) => {
    console.error("채팅방 불러오기 에러:", error);
    setState({ ownerId, rooms: [], isLoading: false });
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

        setState({ ownerId: userId, rooms, isLoading: false });

        rooms.forEach((room) => {
          const messagesRef = collection(db, "chatRooms", room.id, "messages");
          // 방마다 전체 메시지를 구독하지 않도록 최근 메시지 범위에서만 안 읽은 수를 센다
          const messagesQuery = query(
            messagesRef,
            orderBy("createdAt", "desc"),
            limit(UNREAD_SCAN_LIMIT),
          );
          const myLeftAt = room.leftAt?.[userId];

          const msgUnsubscribe = onSnapshot(messagesQuery, (msgSnapshot) => {
            const unreadCount = countUnread(msgSnapshot.docs, userId, myLeftAt);

            setState((prev) => {
              // 유저가 바뀐 뒤 늦게 도착한 스냅샷은 무시
              if (prev.ownerId !== userId) return prev;

              const roomIndex = prev.rooms.findIndex((r) => r.id === room.id);
              if (roomIndex === -1 || prev.rooms[roomIndex].unreadCount === unreadCount) {
                return prev;
              }
              const rooms = [...prev.rooms];
              rooms[roomIndex] = { ...rooms[roomIndex], unreadCount };
              return { ...prev, rooms };
            });
          });

          messageUnsubscribes.push(msgUnsubscribe);
        });
      },
      (error) => handleError(userId, error),
    );

    return () => {
      unsubscribe();
      messageUnsubscribes.forEach((unsub) => unsub());
    };
  }, [userId, handleError]);

  // 보관된 결과가 현재 userId의 것일 때만 사용 (유저 전환/로그아웃 시 즉시 초기화)
  const isCurrent = state.ownerId === userId;
  const chatRooms = isCurrent ? state.rooms : [];

  return {
    chatRooms,
    isLoading: userId ? (isCurrent ? state.isLoading : true) : false,
    totalUnread: sumUnread(chatRooms),
  };
}
