'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ChatRoom } from '../types';
import { db } from '../lib/firebase';



export function useChatRooms(userId: string | undefined) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

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

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rooms: ChatRoom[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            participants: data.participants,
            participantNames: data.participantNames,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });

        setChatRooms(rooms);
        setIsLoading(false);
      },
      (err) => {
        console.error('채팅 목록 에러:', err);
        setError('채팅 목록을 불러오는데 실패했습니다');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { chatRooms, isLoading, error };
}