'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { ChatRoom } from '@/src/types';

interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
}

export function useChatRooms(userId: string | undefined) {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithUnread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!userId) {
     
      return;
    }

    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomsWithUnread: ChatRoomWithUnread[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // 각 채팅방의 메시지에서 읽지 않은 수 계산
        const messagesRef = collection(db, 'chatRooms', docSnap.id, 'messages');
        const messagesQuery = query(messagesRef);

        // 실시간으로 읽지 않은 메시지 수 구독
        let unreadCount = 0;

        const room: ChatRoomWithUnread = {
          id: docSnap.id,
          participants: data.participants,
          participantNames: data.participantNames,
          participantName: '',
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          unreadCount: 0,
        };

        roomsWithUnread.push(room);
      }

      // 각 채팅방의 읽지 않은 메시지 수 계산
      const roomsWithCounts = await Promise.all(
        roomsWithUnread.map(async (room) => {
          const messagesRef = collection(db, 'chatRooms', room.id, 'messages');
          const messagesSnap = await new Promise<number>((resolve) => {
            const unsubscribe = onSnapshot(messagesRef, (msgSnapshot) => {
              const unread = msgSnapshot.docs.filter((msgDoc) => {
                const msgData = msgDoc.data();
                const readBy = msgData.readBy || [];
                // 내가 보낸 메시지는 제외하고, 내가 안 읽은 메시지만 카운트
                return msgData.senderId !== userId && !readBy.includes(userId);
              }).length;
              resolve(unread);
              unsubscribe();
            });
          });
          return { ...room, unreadCount: messagesSnap };
        })
      );

      setChatRooms(roomsWithCounts);
      setTotalUnread(roomsWithCounts.reduce((sum, r) => sum + r.unreadCount, 0));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { chatRooms, isLoading, totalUnread };
}